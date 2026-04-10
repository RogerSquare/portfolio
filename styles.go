package main

import "github.com/charmbracelet/lipgloss"

var (
	primaryColor   = lipgloss.Color("#FDB32A") // Aperture Orange
	accentColor    = lipgloss.Color("#0078D4") // Portal Blue
	successColor   = lipgloss.Color("#00FF41") // Aperture Green
	warningColor   = lipgloss.Color("#00ADFF") // Portal Light Blue
	secondaryColor = lipgloss.Color("#A6ADC8") // High-vis UI Text
	whiteColor     = lipgloss.Color("#FFFFFF") // Pure White
)

const (
	fullStar  = "■"
	emptyStar = "□"
	asciiArt  = `
            ,:/+/-
            /M/              .,-=;//;-
       .:/= ;MH/,    ,=/+%$XH@MM#@:
      -$##@+$###@H@MMM#######H:.    -/H#
 .,H@H@ X######@ -H#####@+-     -+H###@X
  .,@##H;      +XM##M/,     =%@###@X;-
X%-  :M##########$.    .:%M###@%:
M##H,   +H@@@$/-.  ,;$M###@%,          -
M####M=,,---,.-%%H####M$:          ,+@##
@##################@/.         :%H##@$-
M###############H,         ;HM##M$=
#################.    .=$M##M$=
################H..;XM##M$=          .:+
M###################@%=           =+@MH%
@#################M/.         =+H#X%=
=+M###############M,      ,/X#H+:,
  .;XM###########H=   ,/X#H+:;
     .=+HM#######M+/+HM@+=.
         ,:/%XM####H/.
              ,.:=-.
`
)