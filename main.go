package main

import (
	"context"
	"encoding/json"
	"errors"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "embed"

	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/log"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/activeterm"
	bm "github.com/charmbracelet/wish/bubbletea"
	"github.com/charmbracelet/wish/logging"
	"github.com/charmbracelet/wish/ratelimiter"
	"golang.org/x/time/rate"
)

const (
	host = "0.0.0.0"
	port = "2222"
)

//go:embed data.json
var dataBytes []byte

type loadCompleteMsg struct{}

func loadingCmd() tea.Cmd {
	return tea.Tick(500*time.Millisecond, func(t time.Time) tea.Msg {
		return loadCompleteMsg{}
	})
}

type Model struct {
	portfolio     PortfolioData
	viewport      viewport.Model
	loading       spinner.Model
	loaded        bool
	view          int
	viewsCount    int
	terminalWidth int
}

const (
	viewAbout = iota
	viewSkills
	viewProjects
	viewExperience
	viewEducation
	viewContact
)

func initialModel(data PortfolioData) Model {
	vp := viewport.New(0, 0)
	vp.Style = lipgloss.NewStyle().Padding(1, 4)

	loading := spinner.New()
	loading.Spinner = spinner.Dot
	loading.Style = lipgloss.NewStyle().Foreground(primaryColor)

	return Model{
		portfolio:  data,
		viewport:   vp,
		loading:    loading,
		loaded:     false,
		view:       viewAbout,
		viewsCount: 6,
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(loadingCmd(), m.loading.Tick)
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.terminalWidth = msg.Width
		m.viewport.Width = msg.Width
		m.viewport.Height = msg.Height - 12
		m.viewport.SetContent(m.contentForView())
		return m, tea.ClearScreen

	case tea.MouseMsg:
		// Touch / Mouse Tracking for Navigation Bar
		// If the Y coordinate is at the very bottom of the viewport
		if msg.Action == tea.MouseActionRelease && msg.Button == tea.MouseButtonLeft {
			
			// If we are on a narrow screen (mobile), the nav is two rows high.
			isMobileNav := m.terminalWidth < 70
			
			if isMobileNav {
				// Mobile logic (two rows)
				if msg.Y >= m.viewport.Height+2 { // Clicked somewhere in the nav area
					tabWidth := m.terminalWidth / 3 // 3 columns per row

					// Row 1 or Row 2 logic
					rowOffset := 0
					if msg.Y >= m.viewport.Height+4 {
						rowOffset = 3 // Clicked bottom row
					}

					if msg.X < tabWidth {
						m.view = viewAbout + rowOffset
					} else if msg.X < tabWidth*2 {
						m.view = viewSkills + rowOffset
					} else {
						m.view = viewProjects + rowOffset
					}

					m.viewport.SetContent(m.contentForView())
					m.viewport.GotoTop()
					return m, nil
				}
				
			} else {
				// Desktop logic (single row)
				if msg.Y >= m.viewport.Height+3 {
					tabWidth := m.terminalWidth / 6
					
					if msg.X < tabWidth {
						m.view = viewAbout
					} else if msg.X < tabWidth*2 {
						m.view = viewSkills
					} else if msg.X < tabWidth*3 {
						m.view = viewProjects
					} else if msg.X < tabWidth*4 {
						m.view = viewExperience
					} else if msg.X < tabWidth*5 {
						m.view = viewEducation
					} else {
						m.view = viewContact
					}
					
					m.viewport.SetContent(m.contentForView())
					m.viewport.GotoTop()
					return m, nil
				}
			}
		}

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc", "q":
			return m, tea.Quit
		case "]", "right":
			m.view = (m.view + 1) % m.viewsCount
			m.viewport.SetContent(m.contentForView())
			m.viewport.GotoTop()
			return m, nil
		case "[", "left":
			if m.view == 0 {
				m.view = m.viewsCount - 1
			} else {
				m.view--
			}
			m.viewport.SetContent(m.contentForView())
			m.viewport.GotoTop()
			return m, nil
		}
	case loadCompleteMsg:
		m.loaded = true
		m.viewport.SetContent(m.contentForView())
		return m, nil
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.loading, cmd = m.loading.Update(msg)
		return m, cmd
	}

	var vpCmd tea.Cmd
	m.viewport, vpCmd = m.viewport.Update(msg)
	return m, vpCmd
}

func main() {
	var portfolioData PortfolioData
	if err := json.Unmarshal(dataBytes, &portfolioData); err != nil {
		log.Error("Error parsing data.json", "err", err)
		os.Exit(1)
	}

	s, err := wish.NewServer(
		wish.WithAddress(net.JoinHostPort(host, port)),
		wish.WithHostKeyPath(".ssh/term_info_ed25519"),
		wish.WithMaxTimeout(5*time.Minute), // Drop connections after 5 minutes regardless
		wish.WithIdleTimeout(2*time.Minute), // Drop idle connections after 2 minutes
		wish.WithMiddleware(
			ratelimiter.Middleware(ratelimiter.NewRateLimiter(rate.Limit(0.1), 5, 100)), // Max 5 connections burst, ~1 connection every 10 seconds per IP
			bm.Middleware(func(s ssh.Session) (tea.Model, []tea.ProgramOption) {
				pty, _, _ := s.Pty()
				m := initialModel(portfolioData)
				// Set initial width/height right away for SSH clients
				m.terminalWidth = pty.Window.Width
				m.viewport.Width = pty.Window.Width
				m.viewport.Height = pty.Window.Height - 12
				
				return m, []tea.ProgramOption{tea.WithAltScreen()}
			}),
			logging.Middleware(),
			activeterm.Middleware(),
		),
	)
	if err != nil {
		log.Error("Could not start server", "error", err)
		os.Exit(1)
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	
	log.Info("Starting SSH server", "host", host, "port", port)
	
	go func() {
		if err = s.ListenAndServe(); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
			log.Error("Could not start server", "error", err)
			done <- os.Interrupt
		}
	}()
	
	<-done
	log.Info("Stopping server")
	
	ctxSSH, cancelSSH := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancelSSH()
	
	if err := s.Shutdown(ctxSSH); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
		log.Error("Could not stop server", "error", err)
	}
}