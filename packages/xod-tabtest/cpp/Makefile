
SRC:=$(wildcard *.cpp)
OBJ:=$(SRC:.cpp=.o) $(FRAMEWORK_SRC:.cpp=.o)

CXX:=g++
CXX_FLAGS:=-std=c++11 -I.

%.o: %.cpp
	$(CXX) $(CXX_FLAGS) -o $@ -c $<

runTest: $(OBJ)
	$(CXX) -o $@ $^

.PHONY: all
all: runTest

.PHONY: test
test: runTest
	./runTest
