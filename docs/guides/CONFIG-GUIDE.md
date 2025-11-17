# Configuration Guide

Complete guide to configuring the Estonian ID Card Personal Data Reader native helper.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Configuration File Location](#configuration-file-location)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [Command-Line Overrides](#command-line-overrides)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `eid-pd-reader` native application can be configured using a YAML configuration file. This allows you to customize logging, card reader behavior, caching, security settings, and advanced options without modifying code.

**Key features:**
- ✅ YAML format (human-readable)
- ✅ Automatic location detection
- ✅ Command-line overrides
- ✅ Sensible defaults
- ✅ Optional (works without config file)

---

## Configuration File Location

The helper searches for `config.yaml` in the following locations (in order):

### Windows
1. `.\config.yaml` (current directory)
2. Same directory as `eid-pd-reader.exe`
3. `C:\ProgramData\eid-pd-reader\config.yaml`

### Linux
1. `./config.yaml` (current directory)
2. Same directory as `eid-pd-reader`
3. `/etc/eid-pd-reader/config.yaml`

### macOS
1. `./config.yaml` (current directory)
2. Same directory as `eid-pd-reader`
3. `/Library/Application Support/eid-pd-reader/config.yaml`

### Custom Location

You can specify a custom location:

```bash
eid-pd-reader.exe --config C:\path\to\my-config.yaml --dump
```

---

## Configuration Options

### Logging

Control application logging behavior.

```yaml
logging:
  # Enable or disable logging
  enabled: true
  
  # Log level: debug, info, warn, error
  level: info
  
  # Log file path (empty = stderr only)
  # Windows: C:\ProgramData\eid-pd-reader\eid-pd-reader.log
  # Linux: /var/log/eid-pd-reader/eid-pd-reader.log
  # macOS: /usr/local/var/log/eid-pd-reader/eid-pd-reader.log
  file: ""
  
  # Maximum log file size in MB (0 = unlimited)
  max_size_mb: 10
  
  # Maximum number of old log files to keep (0 = keep all)
  max_backups: 5
  
  # Maximum age of log files in days (0 = no age limit)
  max_age_days: 30
  
  # Compress old log files
  compress: true
```

**Options:**
- `enabled`: `true` or `false`
- `level`: `debug`, `info`, `warn`, `error`
- `file`: Full path to log file, or empty string for stderr only
- `max_size_mb`: Integer, 0 for unlimited
- `max_backups`: Integer, 0 to keep all
- `max_age_days`: Integer, 0 for no limit
- `compress`: `true` or `false`

---

### Card Reader

Configure card reader behavior.

```yaml
card:
  # Timeout for card operations in seconds
  timeout_seconds: 30
  
  # Number of retry attempts for failed operations
  retry_attempts: 3
  
  # Delay between retries in milliseconds
  retry_delay_ms: 500
```

**Options:**
- `timeout_seconds`: Integer, operation timeout
- `retry_attempts`: Integer, number of retries
- `retry_delay_ms`: Integer, delay between retries

---

### Cache

Configure data caching.

```yaml
cache:
  # Enable caching of personal data
  enabled: true
  
  # Cache duration in seconds (0 = no expiration)
  duration_seconds: 300  # 5 minutes
```

**Options:**
- `enabled`: `true` or `false`
- `duration_seconds`: Integer, 0 for no expiration

**Note:** Cache is in-memory only, not persisted to disk.

---

### Security

Configure security settings.

```yaml
security:
  # Allowed extension IDs
  allowed_extensions:
    - "chrome-extension://YOUR_EXTENSION_ID/"
  
  # Enable strict origin validation
  strict_validation: true
```

**Options:**
- `allowed_extensions`: List of extension IDs
  - Chrome/Edge format: `chrome-extension://EXTENSION_ID/`
  - Firefox format: `EXTENSION_ID@mozilla.org`
- `strict_validation`: `true` or `false`

**Important:** Update `allowed_extensions` with your actual extension IDs.

---

### Advanced

Advanced configuration options.

```yaml
advanced:
  # Enable verbose APDU logging
  # WARNING: This may log sensitive data
  verbose_apdu: false
  
  # Custom FID mappings for non-standard cards
  custom_fids: {}
    # Example:
    # df_personal: "5000"
    # ef_surname: "5001"
    # ef_given: "5002"
    # ef_code: "5006"
```

**Options:**
- `verbose_apdu`: `true` or `false` (enables detailed APDU command logging)
- `custom_fids`: Map of field names to FID hex values

**Warning:** `verbose_apdu` may log sensitive information. Only enable for debugging.

---

## Examples

### Example 1: Development Configuration

For development with verbose logging:

```yaml
logging:
  enabled: true
  level: debug
  file: "C:\\logs\\eid-pd-reader-dev.log"
  max_size_mb: 50
  max_backups: 10

card:
  timeout_seconds: 60
  retry_attempts: 5

advanced:
  verbose_apdu: true
```

---

### Example 2: Production Configuration

For production with minimal logging:

```yaml
logging:
  enabled: true
  level: warn
  file: "C:\\ProgramData\\eid-pd-reader\\eid-pd-reader.log"
  max_size_mb: 10
  max_backups: 5
  max_age_days: 30
  compress: true

card:
  timeout_seconds: 30
  retry_attempts: 3

cache:
  enabled: true
  duration_seconds: 300

security:
  allowed_extensions:
    - "chrome-extension://abcdefghijklmnopqrstuvwxyz123456/"
  strict_validation: true

advanced:
  verbose_apdu: false
```

---

### Example 3: Disabled Logging

For environments where logging is not desired:

```yaml
logging:
  enabled: false

card:
  timeout_seconds: 30
  retry_attempts: 3

cache:
  enabled: true
  duration_seconds: 300
```

---

### Example 4: Custom Card Configuration

For non-standard cards with custom FIDs:

```yaml
logging:
  enabled: true
  level: info

card:
  timeout_seconds: 45
  retry_attempts: 5
  retry_delay_ms: 1000

advanced:
  verbose_apdu: true
  custom_fids:
    df_personal: "5000"
    ef_surname: "5001"
    ef_given: "5002"
    ef_code: "5006"
    ef_document: "5007"
```

---

## Command-Line Overrides

Command-line flags override configuration file settings.

### Available Flags

```bash
# Specify custom config file
--config <path>          # Path to config.yaml

# Logging overrides
--log <path>             # Log file path (overrides config)
--nolog                  # Disable logging (overrides config)

# Operation modes
--dump                   # Dump personal data and exit
--debug                  # Debug mode (card structure analysis)
--verbose                # Verbose APDU logging (overrides config)
```

### Examples

**Use custom config:**
```bash
eid-pd-reader.exe --config C:\my-config.yaml --dump
```

**Disable logging:**
```bash
eid-pd-reader.exe --nolog --dump
```

**Custom log file:**
```bash
eid-pd-reader.exe --log C:\logs\test.log --dump
```

**Verbose mode:**
```bash
eid-pd-reader.exe --verbose --dump
```

**Combined:**
```bash
eid-pd-reader.exe --config C:\my-config.yaml --verbose --log C:\logs\debug.log --dump
```

---

## Troubleshooting

### Config File Not Found

**Symptom:** Helper uses default settings

**Solution:**
1. Check file location (see [Configuration File Location](#configuration-file-location))
2. Verify file name is exactly `config.yaml`
3. Use `--config` flag to specify custom location
4. Check file permissions (must be readable)

**Test:**
```bash
# Check if config is loaded
eid-pd-reader.exe --config config.yaml --dump
```

---

### Invalid YAML Syntax

**Symptom:** Error message about parsing config file

**Solution:**
1. Validate YAML syntax (use online YAML validator)
2. Check indentation (use spaces, not tabs)
3. Check quotes around strings with special characters
4. Verify colons have space after them

**Common mistakes:**
```yaml
# ❌ Wrong (no space after colon)
logging:enabled: true

# ✅ Correct
logging:
  enabled: true

# ❌ Wrong (tabs instead of spaces)
	enabled: true

# ✅ Correct (2 spaces)
  enabled: true
```

---

### Logging Not Working

**Symptom:** No log file created

**Possible causes:**
1. Logging disabled in config (`enabled: false`)
2. Invalid log file path
3. No write permissions to log directory
4. `--nolog` flag used

**Solution:**
```yaml
# Ensure logging is enabled
logging:
  enabled: true
  level: info
  file: "C:\\ProgramData\\eid-pd-reader\\eid-pd-reader.log"
```

**Create log directory:**
```powershell
# Windows
New-Item -ItemType Directory -Force -Path "C:\ProgramData\eid-pd-reader"

# Linux
sudo mkdir -p /var/log/eid-pd-reader
sudo chmod 755 /var/log/eid-pd-reader
```

---

### Permissions Issues

**Symptom:** Cannot read/write config or log files

**Solution:**

**Windows:**
```powershell
# Grant permissions to config directory
icacls "C:\ProgramData\eid-pd-reader" /grant Users:(OI)(CI)F
```

**Linux:**
```bash
# Grant permissions to config file
sudo chmod 644 /etc/eid-pd-reader/config.yaml

# Grant permissions to log directory
sudo chmod 755 /var/log/eid-pd-reader
```

---

### Verbose Logging Shows Sensitive Data

**Symptom:** Concerned about sensitive data in logs

**Solution:**
```yaml
# Disable verbose APDU logging
advanced:
  verbose_apdu: false

# Use higher log level
logging:
  level: warn  # Only warnings and errors
```

**Important:** Never enable `verbose_apdu` in production unless absolutely necessary for debugging.

---

## Best Practices

### 1. Use Appropriate Log Levels

```yaml
# Development
logging:
  level: debug

# Testing
logging:
  level: info

# Production
logging:
  level: warn
```

### 2. Rotate Logs

```yaml
logging:
  max_size_mb: 10        # Rotate at 10MB
  max_backups: 5         # Keep 5 old logs
  max_age_days: 30       # Delete logs older than 30 days
  compress: true         # Compress old logs
```

### 3. Secure Configuration Files

**Windows:**
```powershell
# Restrict access to config file
icacls "C:\ProgramData\eid-pd-reader\config.yaml" /inheritance:r /grant:r Administrators:F System:F
```

**Linux:**
```bash
# Restrict access to config file
sudo chmod 600 /etc/eid-pd-reader/config.yaml
sudo chown root:root /etc/eid-pd-reader/config.yaml
```

### 4. Document Custom Settings

Add comments to your config file:

```yaml
# Custom configuration for our environment
# Updated: 2024-11-13
# Contact: your-admin@your-domain.com

logging:
  enabled: true
  level: info  # Changed from debug for performance
  file: "C:\\logs\\eid-pd-reader.log"  # Custom log location
```

### 5. Version Control

If using version control:
```gitignore
# .gitignore
config.yaml          # Don't commit local config
*.log                # Don't commit logs
```

Keep a template:
```yaml
# config.yaml.template
logging:
  enabled: true
  level: info
  file: ""  # Set your log path here
```

---

## Security Considerations

### 1. Protect Configuration Files

- Store in secure location with restricted permissions
- Don't include sensitive data (passwords, keys)
- Use environment variables for sensitive values (future feature)

### 2. Validate Extension IDs

```yaml
security:
  allowed_extensions:
    - "chrome-extension://YOUR_REAL_EXTENSION_ID/"
  strict_validation: true
```

- Always use your actual extension IDs
- Never use wildcards or `*`
- Enable `strict_validation`

### 3. Disable Verbose Logging in Production

```yaml
advanced:
  verbose_apdu: false  # IMPORTANT: Disable in production
```

- Verbose APDU logging may expose sensitive data
- Only enable for debugging
- Never enable in production

### 4. Log File Security

- Store logs in secure location
- Rotate and delete old logs
- Monitor log access
- Consider encryption for sensitive environments

---

## Support

Need help with configuration?

1. Check [docs/reference/TROUBLESHOOTING.md](docs/reference/TROUBLESHOOTING.md)
2. Review this guide
3. Open an issue: https://github.com/aarepuusepp/web-eid-pd/issues
4. Email: aare.puusepp@gmail.com

---

## Example Configurations Repository

Find more example configurations in the `examples/` directory (coming soon):
- Development configuration
- Production configuration
- High-security configuration
- Minimal configuration
- Custom card configuration

---

**Configuration complete!** Your `eid-pd-reader` is now configured to your needs.

