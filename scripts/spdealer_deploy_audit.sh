#!/bin/bash
# /tmp/spdealer_deploy_audit.sh
set -euo pipefail
OUTDIR="/tmp/spdealer_deploy_audit_$(date +%Y%m%dT%H%M%S)"
mkdir -p "$OUTDIR"

echo "Collecting files into $OUTDIR"

# Paths
WAR="/usr/local/tomcat10/webapps/spdealer.war"
APPDIR="/usr/local/tomcat10/webapps/spdealer"
LOGDIR_CANDIDATES=("/usr/local/tomcat10/logs" "/var/log/tomcat10" "/var/log/tomcat" "/opt/tomcat/logs")
JOURNALCTL_AVAILABLE=0
command -v journalctl >/dev/null 2>&1 && JOURNALCTL_AVAILABLE=1

# 1) ls -l and stat
echo "### LS L - WAR and appdir" > "$OUTDIR/01_ls.txt" 2>&1
ls -l "$WAR" >> "$OUTDIR/01_ls.txt" 2>&1 || echo "WAR not found" >> "$OUTDIR/01_ls.txt"
ls -ld "$APPDIR" >> "$OUTDIR/01_ls.txt" 2>&1 || echo "APPDIR not found or not exploded" >> "$OUTDIR/01_ls.txt"

echo "### STAT WAR" > "$OUTDIR/02_stat_war.txt"
if [ -f "$WAR" ]; then
  stat --format='File: %n%nSize: %s%nModify: %y%nChange: %z%nAccess: %x' "$WAR" >> "$OUTDIR/02_stat_war.txt" 2>&1 || stat "$WAR" >> "$OUTDIR/02_stat_war.txt" 2>&1
else
  echo "WAR not found" >> "$OUTDIR/02_stat_war.txt"
fi

# 2) sha256
if [ -f "$WAR" ]; then
  echo "### SHA256SUM" > "$OUTDIR/03_sha256.txt"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$WAR" >> "$OUTDIR/03_sha256.txt" 2>&1
  else
    shasum -a 256 "$WAR" >> "$OUTDIR/03_sha256.txt" 2>&1 || echo "No sha256sum or shasum available" >> "$OUTDIR/03_sha256.txt"
  fi
fi

# 3) unzip list / jar tf (first 500 lines)
if [ -f "$WAR" ]; then
  echo "### UNZIP LIST (first 500 lines)" > "$OUTDIR/04_unzip_list.txt"
  if command -v unzip >/dev/null 2>&1; then
    unzip -l "$WAR" | sed -n '1,500p' >> "$OUTDIR/04_unzip_list.txt" 2>&1 || true
  elif command -v jar >/dev/null 2>&1; then
    jar tf "$WAR" | sed -n '1,500p' >> "$OUTDIR/04_unzip_list.txt" 2>&1 || true
  else
    echo "neither unzip nor jar found to list WAR contents" >> "$OUTDIR/04_unzip_list.txt"
  fi

  # Extract MANIFEST.MF if present
  TMPDIR="$(mktemp -d)"
  (cd "$TMPDIR" && jar xf "$WAR" META-INF/MANIFEST.MF 2>/dev/null || true)
  if [ -f "$TMPDIR/META-INF/MANIFEST.MF" ]; then
    echo "### MANIFEST.MF" > "$OUTDIR/05_manifest.txt"
    sed -n '1,200p' "$TMPDIR/META-INF/MANIFEST.MF" >> "$OUTDIR/05_manifest.txt" 2>&1 || true
  else
    echo "MANIFEST.MF not found inside WAR" > "$OUTDIR/05_manifest.txt"
  fi
  rm -rf "$TMPDIR"
fi

# 4) Inspect index.html if exploded
if [ -d "$APPDIR" ]; then
  echo "### INDEX.HTML (first 200 lines)" > "$OUTDIR/06_index_html.txt"
  if [ -f "$APPDIR/index.html" ]; then
    sed -n '1,200p' "$APPDIR/index.html" >> "$OUTDIR/06_index_html.txt" 2>&1 || true
  else
    echo "index.html not found in $APPDIR" >> "$OUTDIR/06_index_html.txt"
  fi

  echo "### APPDIR STAT" > "$OUTDIR/07_appdir_stat.txt"
  stat --format='Dir: %n%nModify: %y%nChange: %z' "$APPDIR" >> "$OUTDIR/07_appdir_stat.txt" 2>&1 || true

  echo "### APPDIR LIST (top 200)" > "$OUTDIR/08_appdir_list.txt"
  ls -l --time=ctime "$APPDIR" | head -n 200 >> "$OUTDIR/08_appdir_list.txt" 2>&1 || ls -l "$APPDIR" | head -n 200 >> "$OUTDIR/08_appdir_list.txt" 2>&1
fi

# 5) Tomcat logs
FOUND_LOGS=0
for d in "${LOGDIR_CANDIDATES[@]}"; do
  if [ -d "$d" ]; then
    FOUND_LOGS=1
    echo "### LOGS IN $d" > "$OUTDIR/09_logs_list_${d//\//_}.txt"
    ls -l "$d" >> "$OUTDIR/09_logs_list_${d//\//_}.txt" 2>&1 || true

    # Grep for spdealer, Deploy, Unpack, WAR events (last 1000 lines)
    echo "### GREP spdealer/Deploy in $d (tail 200)" > "$OUTDIR/10_logs_grep_${d//\//_}.txt"
    grep -iE 'spdealer|deploy|unpack|war|explod' "$d"/* 2>/dev/null | tail -n 200 >> "$OUTDIR/10_logs_grep_${d//\//_}.txt" || true

    # Also capture catalina.out tail if exists
    if [ -f "$d/catalina.out" ]; then
      echo "### TAIL catalina.out (last 500 lines)" > "$OUTDIR/11_catalina_tail.txt"
      tail -n 500 "$d/catalina.out" >> "$OUTDIR/11_catalina_tail.txt" 2>&1 || true
    fi
  fi
done

if [ $FOUND_LOGS -eq 0 ]; then
  echo "No standard Tomcat logs dir found; listing /var/log" > "$OUTDIR/09_logs_list_misc.txt"
  ls -ld /var/log/*tomcat* /var/log/*tomcat* 2>/dev/null >> "$OUTDIR/09_logs_list_misc.txt" || true
fi

# 6) journalctl (if available)
if [ $JOURNALCTL_AVAILABLE -eq 1 ]; then
  echo "### JOURNALCTL tomcat entries (last 1000 lines matching spdealer/Deploy)" > "$OUTDIR/12_journalctl.txt"
  journalctl -u tomcat -n 2000 --no-pager | egrep -i 'spdealer|deploy|unpack|WAR' | tail -n 500 >> "$OUTDIR/12_journalctl.txt" || true
fi

# 7) package results
ARCHIVE="/tmp/spdealer_deploy_audit_$(date +%Y%m%dT%H%M%S).tar.gz"
tar -czf "$ARCHIVE" -C /tmp "$(basename "$OUTDIR")"
echo "Created archive: $ARCHIVE"
echo "Contents:"
tar -tzf "$ARCHIVE" | sed -n '1,200p'
echo "Done. Audit directory: $OUTDIR"
