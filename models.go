package main

type ContactInfo struct {
	Name     string `json:"Name"`
	Title    string `json:"Title"`
	Email    string `json:"Email"`
	Phone    string `json:"Phone"`
	LinkedIn string `json:"LinkedIn"`
	GitHub   string `json:"GitHub"`
	Website  string `json:"Website"`
	Location string `json:"Location"`
}

type SkillCategory struct {
	Name   string   `json:"Name"`
	Skills []string `json:"Skills"`
	Level  int      `json:"Level"`
}

type Project struct {
	Name         string   `json:"Name"`
	Description  string   `json:"Description"`
	Technologies []string `json:"Technologies"`
	Link         string   `json:"Link"`
	LiveDemo     string   `json:"LiveDemo"`
}

type Experience struct {
	Company     string   `json:"Company"`
	Role        string   `json:"Role"`
	Period      string   `json:"Period"`
	Description []string `json:"Description"`
}

type PortfolioData struct {
	Contact    ContactInfo     `json:"Contact"`
	About      string          `json:"About"`
	Skills     []SkillCategory `json:"Skills"`
	Projects   []Project       `json:"Projects"`
	Experience []Experience    `json:"Experience"`
	Education  []Experience    `json:"Education"`
}
