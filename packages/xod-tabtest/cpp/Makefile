
SOURCES := $(wildcard *.cpp)
SKETCHES := $(wildcard *.sketch.cpp)
OBJECTS := $(SOURCES:.cpp=.o)
RUNNERS := $(SKETCHES:.sketch.cpp=.run)
FRAMEWORK_OBJECTS := main.o Arduino.o

CXX:=g++
CXX_FLAGS:=-std=c++11 -I.

%.o: %.cpp
	$(CXX) $(CXX_FLAGS) -o $@ -c $<

%.run: %.sketch.o $(FRAMEWORK_OBJECTS)
	$(CXX) -o $@ $^

.PHONY: all
all: $(RUNNERS)

.PHONY: test
test: $(RUNNERS)
	@for x in $(RUNNERS); do \
	  echo ./$$x; \
	  ./$$x; \
	done
