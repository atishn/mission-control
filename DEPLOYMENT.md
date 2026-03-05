# Mission Control Deployment Guide

## Prerequisites

- Node.js 18+ installed on remote server
- OpenClaw running with gateway enabled
- SSH access to remote server

## Deployment Steps

### 1. Prepare Local Repository

```bash
# Commit all changes
cd mission-control
git add .
git commit -m "Add Ping Smarty chat feature"
git push origin main
```

### 2. Deploy to Remote Server

```bash
# SSH into your server
ssh atish@your-server

# Navigate to projects directory
cd ~/projects

# Clone or pull latest changes
git clone <your-repo-url> mission-control
# OR if already cloned:
cd mission-control
git pull origin main

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
OPENCLAW_ROOT=/home/atish/.openclaw
EOF
```

### 3. Build and Start

```bash
# Build for production
npx next build

# Start the server (port 3333)
npx next start -p 3333

# Or run in background with nohup
nohup npx next start -p 3333 > mission-control.log 2>&1 &
```

### 4. Verify Chat Works

1. Open browser: `http://your-server:3333`
2. Click "Ping Smarty" button in top bar
3. Chat panel should slide in from right
4. Send a message to Smarty
5. You should get a response!

## Process Management (Optional)

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start Mission Control with PM2
pm2 start npm --name "mission-control" -- start -- -p 3333

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/mission-control.service`:

```ini
[Unit]
Description=Mission Control Dashboard
After=network.target

[Service]
Type=simple
User=atish
WorkingDirectory=/home/atish/projects/mission-control
Environment="NODE_ENV=production"
Environment="OPENCLAW_ROOT=/home/atish/.openclaw"
ExecStart=/usr/bin/npx next start -p 3333
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mission-control
sudo systemctl start mission-control
sudo systemctl status mission-control
```

## Troubleshooting

### Chat Not Working

1. **Check OpenClaw Gateway is Running:**
   ```bash
   openclaw gateway status
   ```

2. **Test Gateway Connection:**
   ```bash
   openclaw gateway call health
   ```

3. **Check Mission Control Logs:**
   ```bash
   # If using PM2
   pm2 logs mission-control
   
   # If using systemd
   sudo journalctl -u mission-control -f
   
   # If using nohup
   tail -f mission-control.log
   ```

4. **Verify Environment Variables:**
   ```bash
   cat .env.production
   # Should show: OPENCLAW_ROOT=/home/atish/.openclaw
   ```

5. **Test WebSocket Connection:**
   ```bash
   # Install wscat if needed
   npm install -g wscat
   
   # Test connection
   wscat -c ws://localhost:18789 -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Port Already in Use

```bash
# Find process using port 3333
lsof -i :3333

# Kill the process
kill -9 <PID>

# Or use a different port
npx next start -p 3334
```

### Permission Issues

```bash
# Ensure correct ownership
sudo chown -R atish:atish ~/projects/mission-control

# Ensure OpenClaw workspace is readable
ls -la /home/atish/.openclaw
```

## Updating

```bash
cd ~/projects/mission-control
git pull origin main
npm install
npx next build

# Restart the service
pm2 restart mission-control
# OR
sudo systemctl restart mission-control
```

## Security Notes

- Gateway is bound to `loopback` by default (localhost only)
- Token authentication is enabled
- Mission Control reads token from `openclaw.json`
- No external access to gateway - only Mission Control can connect
- Consider using nginx reverse proxy with SSL for external access

## Nginx Reverse Proxy (Optional)

If you want to access Mission Control from outside:

```nginx
server {
    listen 80;
    server_name mission.yourdomain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then setup SSL with Let's Encrypt:

```bash
sudo certbot --nginx -d mission.yourdomain.com
```
