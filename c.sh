#!/bin/bash

# -----------------------------
# Instalação do Oh My Zsh + Powerlevel10k no Arch Linux
# -----------------------------

set -e

# Atualizar sistema
echo "📦 Atualizando pacotes..."
sudo pacman -Syu --noconfirm

# Instalar Zsh se não estiver instalado
if ! command -v zsh &> /dev/null; then
    echo "⚙️ Instalando Zsh..."
    sudo pacman -S zsh --noconfirm
else
    echo "✅ Zsh já está instalado."
fi

# Instalar Git e curl se necessário
for pkg in git curl unzip wget; do
    if ! pacman -Qi $pkg &> /dev/null; then
        echo "📥 Instalando $pkg..."
        sudo pacman -S $pkg --noconfirm
    fi
done

# Instalar Oh My Zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "🎉 Instalando Oh My Zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
else
    echo "ℹ️ Oh My Zsh já está instalado."
fi

# Instalar Powerlevel10k
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then
    echo "🎨 Instalando tema Powerlevel10k..."
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
        "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
else
    echo "✅ Powerlevel10k já está instalado."
fi

# Alterar o tema no .zshrc
echo "🛠️ Configurando o tema no .zshrc..."
sed -i 's/^ZSH_THEME=.*/ZSH_THEME="powerlevel10k\/powerlevel10k"/' ~/.zshrc

# Instalar fonte Meslo Nerd Font (recomendada para Powerlevel10k)
read -p "Deseja instalar a fonte MesloLGS Nerd Font? (s/n): " INSTALL_FONT
if [[ "$INSTALL_FONT" =~ ^[Ss]$ ]]; then
    echo "🔤 Instalando Meslo Nerd Font..."
    mkdir -p ~/.local/share/fonts
    cd ~/.local/share/fonts
    wget https://github.com/ryanoasis/nerd-fonts/releases/latest/download/Meslo.zip
    unzip -o Meslo.zip
    rm Meslo.zip
    fc-cache -fv
    echo "✅ Fonte instalada. Altere a fonte no seu terminal para MesloLGS NF."
fi

# Tornar Zsh o shell padrão
if [[ "$SHELL" != "$(which zsh)" ]]; then
    echo "🔁 Alterando shell padrão para Zsh..."
    chsh -s "$(which zsh)"
else
    echo "✅ Zsh já é o shell padrão."
fi

echo ""
echo "🚀 Instalação concluída! Reinicie o terminal ou execute 'zsh' para começar a usar."
