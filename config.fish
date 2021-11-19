if status is-interactive
    # Commands to run in interactive sessions can go here
end

set fish_greeting

## Useful aliases
# Replace ls with exa
alias ls='exa -al --color=always --group-directories-first --icons' # preferred listing
alias la='exa -a --color=always --group-directories-first --icons'  # all files and dirs
alias ll='exa -l --color=always --group-directories-first --icons'  # long format
alias lt='exa -aT --color=always --group-directories-first --icons' # tree listing
alias l.="exa -a | egrep '^\.'"                                     # show only dotfiles
alias ip="ip -color"

alias v="nvim"
alias vi="nvim"
alias vim="nvim"

alias fixpacman="sudo rm /var/lib/pacman/db.lck"
alias dir='dir --color=auto'
alias vdir='vdir --color=auto'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Cleanup orphaned packages
alias cleanup='sudo pacman -Rns (pacman -Qtdq)'
