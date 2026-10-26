#!/bin/bash
# ==============================================================================
# Borrowly — Azure for Students Free VM Auto-Setup Script
# Compatible with Ubuntu 22.04 / 24.04 LTS (Standard_B1s / Standard_B2s)
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 Setting up Borrowly on Azure Student Free Linux VM..."
echo "=========================================================="

# 1. Update OS packages
echo "📦 Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw htop ca-certificates gnupg lsb-release

# 2. Add 2GB Swap Memory (Crucial for B1s 1GB Free VM so builds/ML run smoothly)
if [ ! -f /swapfile ]; then
    echo "🧠 Creating 2GB swap space for memory stability..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap memory enabled."
fi

# 3. Install Docker Engine & Docker Compose
echo "🐳 Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
fi

# 4. Open Firewall ports
echo "🛡️ Configuring local firewall rules..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable || true

echo "=========================================================="
echo "🎉 Server environment is ready!"
echo "Now upload Borrowly or git clone your repo, then run:"
echo "   docker compose up -d --build"
echo "=========================================================="
