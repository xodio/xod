#
# This makefile generates PNG files from Fritzing (*.fzz) projects.
#
# Fritzing and Inksacpe installed are required to run `make`.
#
# For each foo.fzz file `make` would generate:
# - foo.fz.png (final artifact)
# - foo_breadboard.svg (intermediate)
# - foo_schematic.svg (intermediate)
#
# Intermediate files are not stored in Git (see ./.gitignore) and
# PNG files *are* strored in Git although they depend on original *.fzz
# It’s done so that one could work on documentation text without heavy
# tools like Make, Fritzing, and Inkscape installed
#

DPI=192

ALL_FZZ = $(shell find . -name "*.fzz")
ALL_FZ_PNG = $(ALL_FZZ:%.fzz=%.fz.png)

%.fz.png: %_breadboard.svg
	inkscape --without-gui \
		--export-png=$@ \
		--export-dpi=$(DPI) \
		--export-area-drawing \
		--export-background=white \
		--export-background-opacity=255 $<

%_breadboard.svg: %.fzz
	Fritzing -svg $(dir $<)

.PHONY: all
all: $(ALL_FZ_PNG)
