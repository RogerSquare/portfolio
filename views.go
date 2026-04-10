package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

func (m Model) View() string {
	if !m.loaded {
		return m.renderLoading()
	}

	header := m.renderHeader(m.view)
	titleBar := m.renderTitleBar(m.view)
	content := m.viewport.View()
	navigation := m.renderNavigationBar(m.view, m.viewsCount)
	footer := m.renderFooter()

	return lipgloss.JoinVertical(lipgloss.Left, header, titleBar, content, navigation, footer)
}

func (m Model) renderLoading() string {
	return lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render(" [SYSTEM BOOT] Loading ...")
}

func (m Model) renderHeader(currentView int) string {
	var viewName string
	switch currentView {
	case viewAbout:
		viewName = "OVERVIEW"
	case viewSkills:
		viewName = "SKILLS"
	case viewProjects:
		viewName = "PROJECTS"
	case viewExperience:
		viewName = "EXPERIENCE"
	case viewEducation:
		viewName = "EDUCATION"
	case viewContact:
		viewName = "CONTACT"
	}

	headerStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(primaryColor).
		Padding(0, 1)

	nameText := lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render(strings.ToUpper(m.portfolio.Contact.Name))
	pipe := lipgloss.NewStyle().Foreground(secondaryColor).Render(" | ")
	viewText := lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render(viewName)

	return headerStyle.Render(nameText + pipe + viewText)
}

func (m Model) renderTitleBar(currentView int) string {
	var sub string
	switch currentView {
	case viewAbout:
		sub = m.portfolio.Contact.Title
	case viewSkills:
		sub = "Technical Capabilities & Expertise"
	case viewProjects:
		sub = "Featured Projects & Contributions"
	case viewExperience:
		sub = "SYSTEM_RECORD: Career Path"
	case viewEducation:
		sub = "Academic Background"
	case viewContact:
		sub = "COMMUNICATIONS: Establish Connection"
	}
	return lipgloss.NewStyle().Foreground(secondaryColor).Italic(true).Render("    " + sub + "\n")
}

func (m Model) contentForView() string {
	switch m.view {
	case viewAbout:
		return m.renderAbout()
	case viewSkills:
		return m.renderSkills()
	case viewProjects:
		return m.renderProjects()
	case viewExperience:
		return m.renderExperience()
	case viewEducation:
		return m.renderEducation()
	case viewContact:
		return m.renderContact()
	default:
		return ""
	}
}

func (m Model) renderAbout() string {
	asciiStyle := lipgloss.NewStyle().
		Foreground(whiteColor).
		MarginRight(4)

	// Responsive logic for About section
	// If the terminal is wide enough, put them side-by-side.
	// If it's too narrow (like a phone), stack them vertically.
	isMobile := m.viewport.Width < 85

	var wrapWidth int
	if isMobile {
		// Full width minus safe padding
		wrapWidth = m.viewport.Width - 12
	} else {
		// Side-by-side width (subtracting ascii art width + padding)
		wrapWidth = m.viewport.Width - 60
	}

	if wrapWidth < 30 {
		wrapWidth = 30
	}

	bioStyle := lipgloss.NewStyle().
		Width(wrapWidth).
		Foreground(primaryColor)

	art := asciiStyle.Render(asciiArt)
	bio := bioStyle.Render(m.portfolio.About)

	if isMobile {
		// Center the ASCII art on mobile and stack vertically
		centeredArt := lipgloss.NewStyle().Width(m.viewport.Width - 8).Align(lipgloss.Center).Render(asciiArt)
		return lipgloss.JoinVertical(lipgloss.Top, centeredArt, "\n", bio)
	}

	return lipgloss.JoinHorizontal(lipgloss.Top, art, bio)
}

func (m Model) renderSkills() string {
	var sb strings.Builder
	for idx, cat := range m.portfolio.Skills {
		var stars string
		for i := 0; i < 5; i++ {
			if i < cat.Level {
				stars += lipgloss.NewStyle().Foreground(successColor).Render(fullStar)
			} else {
				stars += lipgloss.NewStyle().Foreground(secondaryColor).Render(emptyStar)
			}
		}
		sb.WriteString(lipgloss.NewStyle().Foreground(accentColor).Bold(true).Render(cat.Name+" "+stars) + "\n")

		// Ensure skills string doesn't overflow
		skillsList := strings.Join(cat.Skills, " • ")
		wrapWidth := m.viewport.Width - 8 // 8 is the total viewport padding
		if wrapWidth < 30 {
			wrapWidth = 30
		}

		skillsStyle := lipgloss.NewStyle().Width(wrapWidth).Foreground(primaryColor)
		sb.WriteString(lipgloss.NewStyle().Foreground(warningColor).Render(">> ") + skillsStyle.Render(skillsList) + "\n")

		if idx < len(m.portfolio.Skills)-1 {
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

func (m Model) renderProjects() string {
	var sb strings.Builder
	// m.viewport has padding 4 on left and 4 on right (total 8)
	// Additional 2 spaces used in description render "  "
	wrapWidth := m.viewport.Width - 12
	if wrapWidth < 40 {
		wrapWidth = 40
	}

	descStyle := lipgloss.NewStyle().Width(wrapWidth).Align(lipgloss.Left)

	for idx, p := range m.portfolio.Projects {
		sb.WriteString(lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render("> PROJECT: "+p.Name) + "\n")
		if p.Link != "" {
			sb.WriteString("  " + lipgloss.NewStyle().Foreground(warningColor).Italic(true).Render("URL: "+p.Link) + "\n")
		}

		sb.WriteString(descStyle.Render("  "+p.Description) + "\n\n")

		sb.WriteString("  ")

		// Badge string builder
		var badgeSb strings.Builder
		for _, tech := range p.Technologies {
			badge := lipgloss.NewStyle().
				Background(primaryColor).
				Foreground(lipgloss.Color("#000000")).
				Render(" " + tech + " ")
			badgeSb.WriteString(badge + " ")
		}

		// Wrap badges to avoid horizontal overflow
		badgesStyle := lipgloss.NewStyle().Width(wrapWidth)
		sb.WriteString(badgesStyle.Render(badgeSb.String()))

		if p.LiveDemo != "" {
			sb.WriteString("\n  " + lipgloss.NewStyle().Foreground(secondaryColor).Render("Demo: "+p.LiveDemo))
		}

		sb.WriteString("\n")
		if idx < len(m.portfolio.Projects)-1 {
			sepLength := wrapWidth / 2
			if sepLength < 1 {
				sepLength = 1
			}
			sep := lipgloss.NewStyle().Foreground(secondaryColor).Render(strings.Repeat("┈", sepLength))
			sb.WriteString("\n  " + sep + "\n\n")
		}
	}
	return sb.String()
}

func (m Model) renderExperience() string {
	var sb strings.Builder
	// Padding 8 for viewport + 4 for inner list styling = 12 total safe margin
	wrapWidth := m.viewport.Width - 12
	if wrapWidth < 40 {
		wrapWidth = 40
	}
	descStyle := lipgloss.NewStyle().Width(wrapWidth)

	for idx, exp := range m.portfolio.Experience {
		sb.WriteString(lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render(exp.Company+" | "+exp.Period) + "\n")
		sb.WriteString(lipgloss.NewStyle().Foreground(accentColor).Bold(true).Render("  RANK: "+exp.Role) + "\n")
		for _, d := range exp.Description {
			sb.WriteString(descStyle.Render("  "+lipgloss.NewStyle().Foreground(successColor).Render(">> ")+d) + "\n")
		}
		if idx < len(m.portfolio.Experience)-1 {
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

func (m Model) renderEducation() string {
	var sb strings.Builder
	for idx, edu := range m.portfolio.Education {
		sb.WriteString(lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Render(edu.Company+" | "+edu.Period) + "\n")
		sb.WriteString(lipgloss.NewStyle().Foreground(accentColor).Bold(true).Render("  >> "+edu.Role) + "\n")
		for _, d := range edu.Description {
			sb.WriteString("    - " + d + "\n")
		}
		if idx < len(m.portfolio.Education)-1 {
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

func (m Model) renderContact() string {
	var sb strings.Builder

	rowStyle := lipgloss.NewStyle().PaddingLeft(2).MarginBottom(1)

	var items []struct{ l, v string }
	if m.portfolio.Contact.Location != "" {
		items = append(items, struct{ l, v string }{"LOCATION:", m.portfolio.Contact.Location})
	}
	if m.portfolio.Contact.Phone != "" {
		items = append(items, struct{ l, v string }{"PHONE:   ", m.portfolio.Contact.Phone})
	}
	if m.portfolio.Contact.Email != "" {
		items = append(items, struct{ l, v string }{"EMAIL:   ", m.portfolio.Contact.Email})
	}
	if m.portfolio.Contact.Website != "" {
		items = append(items, struct{ l, v string }{"WEBSITE: ", "https://" + m.portfolio.Contact.Website})
	}
	if m.portfolio.Contact.LinkedIn != "" {
		items = append(items, struct{ l, v string }{"LINKEDIN:", "https://" + m.portfolio.Contact.LinkedIn})
	}
	if m.portfolio.Contact.GitHub != "" {
		items = append(items, struct{ l, v string }{"GITHUB:  ", "https://" + m.portfolio.Contact.GitHub})
	}

	for _, item := range items {
		valColor := primaryColor
		if strings.Contains(item.v, "http") {
			valColor = warningColor
		}

		label := lipgloss.NewStyle().Foreground(primaryColor).Bold(true).Width(12).Render(item.l)
		value := lipgloss.NewStyle().Foreground(valColor).Render(item.v)

		sb.WriteString(rowStyle.Render(label+" "+value) + "\n")
	}
	return sb.String()
}

func (m Model) renderNavigationBar(curr int, total int) string {
	titles := []string{"ABOUT", "SKILLS", "PROJECTS", "EXPERIENCE", "EDUCATION", "CONTACT"}
	
	var sb strings.Builder
	sb.WriteString("\n")

	// If the terminal is too narrow to fit all 6 tabs comfortably (e.g. mobile portrait)
	isMobileNav := m.terminalWidth < 70

	if isMobileNav {
		// --- Two-Row Mobile Navigation ---
		// Row 1: 3 tabs, Row 2: 3 tabs
		tabWidth := m.terminalWidth / 3
		
		// Row 1
		for i := 0; i < 3; i++ {
			title := titles[i]
			// Center text roughly in its third of the screen
			padLeft := (tabWidth - len(title)) / 2
			padRight := tabWidth - len(title) - padLeft
			if padLeft < 0 { padLeft = 0 }
			if padRight < 0 { padRight = 0 }
			
			paddedTitle := strings.Repeat(" ", padLeft) + title + strings.Repeat(" ", padRight)
			
			if i == curr {
				style := lipgloss.NewStyle().Background(primaryColor).Foreground(lipgloss.Color("#000000")).Bold(true)
				sb.WriteString(style.Render(paddedTitle))
			} else {
				style := lipgloss.NewStyle().Foreground(secondaryColor)
				sb.WriteString(style.Render(paddedTitle))
			}
		}
		
		sb.WriteString("\n")
		
		// Row 2
		for i := 3; i < 6; i++ {
			title := titles[i]
			padLeft := (tabWidth - len(title)) / 2
			padRight := tabWidth - len(title) - padLeft
			if padLeft < 0 { padLeft = 0 }
			if padRight < 0 { padRight = 0 }
			
			paddedTitle := strings.Repeat(" ", padLeft) + title + strings.Repeat(" ", padRight)
			
			if i == curr {
				style := lipgloss.NewStyle().Background(primaryColor).Foreground(lipgloss.Color("#000000")).Bold(true)
				sb.WriteString(style.Render(paddedTitle))
			} else {
				style := lipgloss.NewStyle().Foreground(secondaryColor)
				sb.WriteString(style.Render(paddedTitle))
			}
		}
		
	} else {
		// --- Single-Row Desktop Navigation ---
		tabWidth := m.terminalWidth / 6
		if tabWidth < len("EXPERIENCE")+2 {
			tabWidth = len("EXPERIENCE") + 2
		}

		for i, title := range titles {
			paddedTitle := fmt.Sprintf(" %-*s", tabWidth-1, title)
			
			if i == curr { 
				style := lipgloss.NewStyle().
					Background(primaryColor).
					Foreground(lipgloss.Color("#000000")).
					Bold(true)
				sb.WriteString(style.Render(paddedTitle))
			} else {
				style := lipgloss.NewStyle().Foreground(secondaryColor)
				sb.WriteString(style.Render(paddedTitle))
			}
		}
	}

	return sb.String()
}

func (m Model) renderFooter() string {
	keyStyle := lipgloss.NewStyle().Foreground(primaryColor).Bold(true)
	descStyle := lipgloss.NewStyle().Foreground(secondaryColor)

	return "\n  " + keyStyle.Render("[q]") + descStyle.Render("uit") + " | " +
		keyStyle.Render("[← →]") + descStyle.Render(" navigate")
}
