# BubbleViews Security Hardening Guide

## Executive Summary

This document outlines the security measures taken to harden the BubbleViews infrastructure on Hetzner Cloud and the codebase. All credentials have been removed from version control, malware has been cleaned from the server, and comprehensive security controls are in place.

**Date**: 2025-12-22
**Status**: Security hardening completed

---

## Incident Response Summary

### Major Malware Incident (Dec 22, 2025)

**Issue**: Server was heavily compromised with multiple cryptocurrency miners and persistence mechanisms. SSH was disabled by attackers to lock out the owner.

**Malware Found**:

| Service/File | Type | Details |
|--------------|------|---------|
| `moneroocean_miner.service` | Crypto miner | XMRig mining to Monero Ocean pool |
| `javae.service` | Hidden miner | Disguised as VMware service, mining to supportxmr.com |
| `syssls.service` | Crypto miner | Mining via Unmineable pool |
| `systemd-x86.service` | Malware dropper | Downloads/executes code from `ellison.st` |
| `monitor-x86.service/timer` | Persistence | Monitors and reinstalls malware |
| `S99x86` (init.d) | Persistence | Legacy init script for boot persistence |
| `/var/tmp/.font/n0de` | Miner binary | Hidden crypto miner |
| `/tmp/x86` | Miner binary | Downloaded malware |
| Crontab entries | Persistence | @reboot entries downloading from `ellison.st` |
| `package.json` infection | Code injection | `npm start` modified to run miner |

**Attack Vector**: Likely brute-force SSH with weak password or exposed credentials.

**Response Actions Taken**:
- Accessed server via Hetzner rescue mode (SSH was blocked)
- Reinstalled `openssh-server` (binary was deleted by attackers)
- Removed all malicious systemd services
- Removed all malicious crontab entries
- Removed all malware binaries
- Cleaned infected `package.json`
- Reset root password to strong random value
- Enabled SSH key-only authentication
- Disabled SSH password authentication
- Reset dashboard admin password
- Enabled UFW firewall
- Added 2GB swap (server had none, causing OOM during builds)
- Rebuilt frontend application

---

## 1. Current Server Configuration

### 1.1 Server Details

| Field | Value |
|-------|-------|
| Provider | Hetzner Cloud |
| Server Name | bubbleviews |
| IP Address | 46.224.85.191 |
| Server Type | CX22 (2 vCPU, 4GB RAM, 40GB SSD) |
| OS | Ubuntu 24.04 |
| Datacenter | Nuremberg (nbg1-dc3) |

### 1.2 Access Credentials

**SSH Access** (Key-only):
```bash
ssh root@46.224.85.191
# Uses key: ~/.ssh/id_ed25519
# Password authentication: DISABLED
```

**Dashboard Access**:
- URL: http://46.224.85.191:3000
- Username: `admin`
- Password: Stored in `backend/.env` (not committed)

**API Access**:
- URL: http://46.224.85.191:8000
- Docs: http://46.224.85.191:8000/docs

**Hetzner Cloud CLI**:
```bash
# Install
winget install hetznercloud.cli

# Use with token
HCLOUD_TOKEN=<token> hcloud server list
```

---

## 2. Security Controls Implemented

### 2.1 SSH Hardening

**Current Configuration** (`/etc/ssh/sshd_config`):
```ini
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
```

**Key Points**:
- Password login completely disabled
- Only SSH key authentication works
- Root can only login with key (not password)

**Authorized Key**:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIORdHHc/Mq9hM8JqCHU0wAKJIgW/FW3tnrcckw9a30Be jorisdupraz@gmail.com
```

### 2.2 Firewall (UFW)

**Status**: Active

**Rules**:
```
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere    # SSH
80/tcp                     ALLOW       Anywhere    # HTTP
443/tcp                    ALLOW       Anywhere    # HTTPS
3000/tcp                   ALLOW       Anywhere    # Frontend
8000/tcp                   ALLOW       Anywhere    # API
```

**All other ports are blocked.**

### 2.3 Swap Space

**Added**: 2GB swap file to prevent OOM during builds.
```bash
# Verify
free -h
# Should show: Swap: 2.0Gi
```

**Persisted** in `/etc/fstab`:
```
/swapfile none swap sw 0 0
```

### 2.4 Services Running

| Service | Port | Status |
|---------|------|--------|
| `bubbleviews-api` | 8000 | Active |
| `bubbleviews-frontend` | 3000 | Active |
| `caddy` | 80, 443 | Active |
| `ssh` | 22 | Active |

---

## 3. Malware Removal Commands Used

### 3.1 Remove Malicious Services

```bash
# Stop and disable services
systemctl stop moneroocean_miner.service javae.service syssls.service systemd-x86.service monitor-x86.service
systemctl disable moneroocean_miner.service javae.service syssls.service systemd-x86.service monitor-x86.service

# Remove service files
rm -f /etc/systemd/system/moneroocean_miner.service
rm -f /etc/systemd/system/javae.service
rm -f /etc/systemd/system/syssls.service
rm -f /etc/systemd/system/systemd-x86.service
rm -f /etc/systemd/system/monitor-x86.service
rm -f /etc/systemd/system/monitor-x86.timer

# Remove init.d script
rm -f /etc/init.d/S99x86

# Reload systemd
systemctl daemon-reload
```

### 3.2 Remove Malware Binaries

```bash
rm -rf /root/moneroocean
rm -rf /var/tmp/.font
rm -rf /var/tmp/.XIN-unix
rm -f /var/tmp/.font/n0de
rm -f /tmp/x86
rm -f /root/BubbleViews/frontend/x86
rm -f /usr/bin/syssls
```

### 3.3 Clean Crontabs

```bash
# Remove root crontab
crontab -r

# Clean /etc/crontab (remove ellison.st entries)
grep -v "ellison.st" /etc/crontab > /tmp/clean_crontab && mv /tmp/clean_crontab /etc/crontab
```

### 3.4 Fix Infected package.json

The attackers modified `frontend/package.json`:
```json
// INFECTED (before):
"start": "nohup /var/tmp/.font/n0de > /dev/null 2>&1 & next start"

// CLEAN (after):
"start": "next start"
```

### 3.5 Reinstall SSH

SSH binary was deleted by attackers:
```bash
# In rescue mode
mount /dev/sda1 /mnt
mount --bind /dev /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys
cp /etc/resolv.conf /mnt/etc/resolv.conf
chroot /mnt apt-get install --reinstall openssh-server -y
```

---

## 4. Verification Commands

### 4.1 Check for Remaining Malware

```bash
# Check suspicious processes
ps aux | grep -E "miner|xmrig|n0de|cryptonight" | grep -v grep

# Check suspicious services
systemctl list-units --type=service --state=running | grep -E "miner|javae|syssls|x86|monero"

# Check crontabs
crontab -l
cat /etc/crontab | grep -v "^#"

# Check hidden files in /var/tmp
ls -la /var/tmp/ | grep "^\."

# Check listening ports
ss -tlnp

# Check package.json is clean
grep -A5 "scripts" /root/BubbleViews/frontend/package.json
```

### 4.2 Check Services

```bash
# All services status
systemctl status bubbleviews-api bubbleviews-frontend caddy ssh

# Check frontend doesn't have malware in process tree
systemctl status bubbleviews-frontend
# Should NOT show any n0de or .font processes
```

---

## 5. Credential Rotation (REQUIRED)

**These credentials may have been stolen and should be rotated:**

### 5.1 Hetzner API Token
- Location: Hetzner Cloud Console > Security > API Tokens
- Current token was used during recovery
- Generate new token after recovery complete

### 5.2 OpenRouter API Key
- Location: https://openrouter.ai/keys
- Regenerate and update in `/root/BubbleViews/backend/.env`

### 5.3 Reddit API Credentials
- Location: https://www.reddit.com/prefs/apps
- Create new app or regenerate secret
- Update in `/root/BubbleViews/backend/.env`

### 5.4 JWT Secret Key
- Generate new: `openssl rand -hex 32`
- Update in `/root/BubbleViews/backend/.env`
- Note: This will invalidate all existing sessions

---

## 6. Backup and Recovery

### 6.1 Database Backup

```bash
# Manual backup
ssh root@46.224.85.191 "sqlite3 /root/BubbleViews/backend/data/reddit_agent.db 'PRAGMA wal_checkpoint(TRUNCATE);'"
scp root@46.224.85.191:/root/BubbleViews/backend/data/reddit_agent.db ./backup/

# FAISS index backup
scp root@46.224.85.191:/root/BubbleViews/backend/data/faiss_index.bin ./backup/
```

### 6.2 Server Recovery via Hetzner CLI

If SSH is blocked again:
```bash
# Enable rescue mode
HCLOUD_TOKEN=<token> hcloud server enable-rescue bubbleviews --type linux64
HCLOUD_TOKEN=<token> hcloud server reboot bubbleviews

# Wait for boot, then SSH with rescue password shown in output
ssh root@46.224.85.191

# Mount disk and fix issues
mount /dev/sda1 /mnt
# ... make changes ...

# Disable rescue and reboot to normal
HCLOUD_TOKEN=<token> hcloud server disable-rescue bubbleviews
HCLOUD_TOKEN=<token> hcloud server reboot bubbleviews
```

---

## 7. Monitoring

### 7.1 View Logs

```bash
# API logs
ssh root@46.224.85.191 "journalctl -u bubbleviews-api -f"

# Frontend logs
ssh root@46.224.85.191 "journalctl -u bubbleviews-frontend -f"

# SSH auth logs (for intrusion detection)
ssh root@46.224.85.191 "tail -f /var/log/auth.log"
```

### 7.2 Resource Monitoring

```bash
# Memory/CPU
ssh root@46.224.85.191 "htop"

# Disk usage
ssh root@46.224.85.191 "df -h"

# Network connections
ssh root@46.224.85.191 "ss -tlnp"
```

---

## 8. Future Recommendations

### 8.1 High Priority

- [ ] Rotate all API credentials (OpenRouter, Reddit)
- [ ] Set up automated backups
- [ ] Configure Fail2Ban for SSH protection
- [ ] Consider restricting SSH to specific IPs

### 8.2 Medium Priority

- [ ] Set up proper HTTPS with domain name
- [ ] Create non-root service account for running apps
- [ ] Set up log aggregation/monitoring
- [ ] Configure automated security updates

### 8.3 Low Priority

- [ ] Upgrade server if performance issues persist
- [ ] Set up staging environment
- [ ] Implement CI/CD pipeline

---

## 9. Quick Reference

### Access URLs

| Service | URL |
|---------|-----|
| Dashboard | http://46.224.85.191:3000 |
| API | http://46.224.85.191:8000 |
| API Docs | http://46.224.85.191:8000/docs |

### SSH Commands

```bash
# Connect
ssh root@46.224.85.191

# Restart services
ssh root@46.224.85.191 "systemctl restart bubbleviews-api bubbleviews-frontend"

# View logs
ssh root@46.224.85.191 "journalctl -u bubbleviews-api -n 50"

# Check for malware
ssh root@46.224.85.191 "ps aux | grep -E 'miner|xmrig' | grep -v grep"
```

### Hetzner CLI Commands

```bash
# List servers
HCLOUD_TOKEN=<token> hcloud server list

# Reboot server
HCLOUD_TOKEN=<token> hcloud server reboot bubbleviews

# Power cycle
HCLOUD_TOKEN=<token> hcloud server poweroff bubbleviews
HCLOUD_TOKEN=<token> hcloud server poweron bubbleviews

# Enable rescue mode
HCLOUD_TOKEN=<token> hcloud server enable-rescue bubbleviews --type linux64
```

---

## 10. Incident Timeline (Dec 22, 2025)

| Time | Action |
|------|--------|
| ~18:00 | Discovered SSH blocked, server compromised |
| 18:05 | Installed Hetzner CLI (`hcloud`) |
| 18:10 | Enabled rescue mode via hcloud |
| 18:15 | Discovered multiple crypto miners |
| 18:20 | Found SSH binary deleted, crontab persistence |
| 18:25 | Removed malicious services and binaries |
| 18:30 | Reinstalled openssh-server |
| 18:35 | Fixed infected package.json |
| 18:40 | Enabled SSH key-only authentication |
| 18:45 | Reset passwords (root, dashboard admin) |
| 18:50 | Configured UFW firewall |
| 18:55 | Added 2GB swap |
| 19:00 | Rebuilt frontend |
| 19:05 | Verified all services working |

---

**Last Updated**: 2025-12-22
**Next Review**: 2025-01-22 (30 days)
