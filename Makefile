
COMPILE_NODE = ./targets/espruino/cli/compile-node.js
NODES_IN_DIR = nodes
NODES_OUT_DIR = build/espruino/nodes

IN_NODES = $(shell find $(NODES_IN_DIR) -name "*.json5")
OUT_NODES = $(IN_NODES:$(NODES_IN_DIR)/%.json5=$(NODES_OUT_DIR)/%.js)

%/.touch:
	mkdir -p $@
	touch $@/.touch

$(NODES_OUT_DIR)/%.js: $(NODES_IN_DIR)/%.json5 $(NODES_OUT_DIR)/.touch
	$(COMPILE_NODE) $< $@

all: $(OUT_NODES)


.PHONY:
	all

.SECONDARY:

