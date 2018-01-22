#!/bin/bash
#
# Run this script to create desktop entry for the development version
# of XOD IDE. XOD file types will be associated with the development
# version too.
#

set -e

# The first is for per-user, the second is system-wide
MIME_DIR=$HOME/.local/share/mime
#MIME_DIR=/usr/share/mime/packages

APP_DIR=$HOME/.local/share/applications
#APP_DIR=/usr/share/applications

# ===========================================================================

# Create MIME-type

MIME_PKG_DIR=$MIME_DIR/packages
MIME_XML_PATH=$MIME_PKG_DIR/xod.xml

cat <<EOF >$MIME_XML_PATH
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/vnd.xod.xodball+json">
    <comment>XOD packed project</comment>
    <glob pattern="*.xodball"/>
  </mime-type>
  <mime-type type="application/vnd.xod.project+json">
    <comment>XOD project manifest</comment>
    <glob pattern="project.xod"/>
  </mime-type>
  <mime-type type="application/vnd.xod.patch+json">
    <comment>XOD patch</comment>
    <glob pattern="*.xodp"/>
  </mime-type>
</mime-info>
EOF

update-mime-database $MIME_DIR

# Make .desktop entry with file associations

WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
DESKTOP_ENTRY_PATH=$APP_DIR/xod-client-electron.desktop

cat <<EOF >$DESKTOP_ENTRY_PATH
[Desktop Entry]
Name=XOD IDE (dev)
Comment=XOD visual programming language IDE
Path=$WORK_DIR
Exec=yarn start:electron %U
Terminal=false
Type=Application
Categories=Development;
Icon=$WORK_DIR/packages/xod-client-electron/build/icon.svg
MimeType=application/vnd.xod.xodball+json;application/vnd.xod.project+json;application/vnd.xod.patch+json;
EOF

update-desktop-database $APP_DIR
