open Belt;

/* Filename -> Content */
type t = Map.String.t(string);

/* A probe is a node used later to inject values into a node under test.
   Kind of terminal, but for tests.

   A probe stores reference to its target pin. That pin’s label is guaranted
   to be normalized. */
module Probe = {
  type t = {
    node: Node.t,
    targetPin: Pin.t,
  };
  /* Trivial accessors */
  let getNode = (probe: t) => probe.node;
  let getTargetPin = (probe: t) => probe.targetPin;
  /* Returns full patch path for the probe of a given type. The probe patch
     nodes are stocked up in the `workspace` inside the package */
  let patchPath = (tp: Pin.dataType, dir: Pin.direction) : string =>
    "xod/tabtest/"
    ++ (
      switch (dir) {
      | Input => "inject-"
      | Output => "capture-"
      }
    )
    ++ (
      switch (tp) {
      | Pulse => "pulse"
      | Boolean => "boolean"
      | Number => "number"
      | Byte => "byte"
      | String => "string"
      }
    );
  /* Creates a new probe node matching the type of pin provided */
  let create = pin => {
    node: Node.create(patchPath(Pin.getType(pin), Pin.getDirection(pin))),
    targetPin: pin,
  };
  /* Returns a key of the only pin (conventionally labeled "VAL") for a
     probe node. */
  let getPinKeyExn = (probe, project) => {
    let node = getNode(probe);
    let pt = Node.getType(node);
    let patch =
      switch (Project.getPatchByNode(project, node)) {
      | Some(patch') => patch'
      | None => Js.Exn.raiseError("Probe has unexpected type " ++ pt)
      };
    let pin =
      Patch.findPinByLabel(patch, "VAL", ~normalize=true, ~direction=None);
    switch (pin) {
    | Some(pin) => Pin.getKey(pin)
    | None =>
      Js.Exn.raiseError(
        "Expected all probes to have the only pin labeled 'VAL'. "
        ++ pt
        ++ " violates the rule",
      )
    };
  };
};

/* Utilities to operate over lists of probes */
module Probes = {
  type t = list(Probe.t);
  let map = List.map;
  let keepToPinDirection = (probes, dir) =>
    List.keep(probes, probe =>
      probe |. Probe.getTargetPin |. Pin.getDirection == dir
    );
  let keepInjecting = keepToPinDirection(_, Input);
  let keepCapturing = keepToPinDirection(_, Output);
};

/* TODO: smarter errors */
let newError = (message: string) : Js.Exn.t =>
  try (Js.Exn.raiseError(message)) {
  | Js.Exn.Error(e) => e
  };

/* Test bench is a patch containing a central node under test and
   a set of probes connected to each of its pins. */
module Bench = {
  type t = {
    patch: Patch.t,
    probes: Probes.t,
    /* Maps pin labels of the node under test to probe node IDs */
    probeMap: Map.String.t(Node.id),
  };
  /* Creates a new bench for the project provided with the specified
     node instance to test. The bench patch is *not* associated to the
     project automatically. */
  let create = (project, patchUnderTest) : t => {
    /* nut = node under test */
    let nut = Node.create(Patch.getPath(patchUnderTest));
    let nutId = Node.getId(nut);
    let draftBench: t = {
      patch: Patch.create() |. Patch.assocNode(nut),
      probes: [],
      probeMap: Map.String.empty,
    };
    Patch.listPins(patchUnderTest)
    |. Pin.normalizeLabels
    /* For each pin of a node under test, create a new probe node
       and link its `VAL` to that pin. */
    |. List.map(Probe.create)
    |. List.reduce(
         draftBench,
         (bench, probe) => {
           let probeNode = Probe.getNode(probe);
           let probeId = Node.getId(probeNode);
           let probePK = Probe.getPinKeyExn(probe, project);
           let targPin = Probe.getTargetPin(probe);
           let targPK = Pin.getKey(targPin);
           let link =
             switch (Pin.getDirection(targPin)) {
             | Input =>
               Link.create(
                 ~fromPin=probePK,
                 ~fromNode=probeId,
                 ~toPin=targPK,
                 ~toNode=nutId,
               )
             | Output =>
               Link.create(
                 ~fromPin=targPK,
                 ~fromNode=nutId,
                 ~toPin=probePK,
                 ~toNode=probeId,
               )
             };
           {
             patch:
               bench.patch
               |. Patch.assocNode(probeNode)
               |. Patch.assocLinkExn(link),
             probes: [probe, ...bench.probes],
             probeMap:
               bench.probeMap
               |. Map.String.set(Pin.getLabel(targPin), probeId),
           };
         },
       ); /* reduce */
  };
};

/* A pico-framework to generate properly formatted C++ code.
   Knows nothing about tabular tests, i.e., purpose-neutral. */
module Cpp = {
  type code = string;
  let source = children => Holes.String.joinLines(children);
  let indented = children =>
    children |. Holes.String.joinLines |. Holes.String.indent(4);
  let enquote = x => {j|"$x"|j};
  let block = children =>
    ["{", indented(children), "}"] |. Holes.String.joinLines;
  let catch2TestCase = (name, children) =>
    "TEST_CASE(" ++ enquote(name) ++ ") " ++ block(children);
  let requireEqual = (actual, expected) => {j|REQUIRE($actual == $expected);|j};
};

/* A test case corresponds to TEST_CASE in Catch2 and a single TSV tabtest in XOD. */
module TestCase = {
  /* Formats a tabular value to a valid C++ literal or expression */
  let valueToLiteral = (value: TabData.Value.t) : string =>
    switch (value) {
    | Boolean(true) => "true"
    | Boolean(false) => "false"
    | NaN => "NAN"
    | String(x) => Cpp.enquote(x)
    | x => {j|$x|j}
    };
  /* Generates a block of code corresponding to a single TSV line check.
     Contains setup, evaluation, and assertion validation. It might
     be wrapped into Catch2 SECTION, the purpose is the same. */
  let generateSection = (record, probes) : Cpp.code => {
    let injectionStatements =
      probes
      |. Probes.keepInjecting
      |. Probes.map(probe => {
           let name = probe |. Probe.getTargetPin |. Pin.getLabel;
           switch (record |. TabData.Record.get(name)) {
           | Some(value) => {j|INJECT(probe_$name, $value);|j}
           | None => {j|// No changes for $name|j}
           };
         });
    let assertionsStatements =
      probes
      |. Probes.keepCapturing
      |. Probes.map(probe => {
           let name = probe |. Probe.getTargetPin |. Pin.getLabel;
           switch (record |. Map.String.get(name)) {
           | Some(value) =>
             Cpp.requireEqual(
               {j|probe_$name.state.lastValue|j},
               valueToLiteral(value),
             )
           | None => {j|// no expectation for $name|j}
           };
         });
    Cpp.(
      source([
        "",
        source(injectionStatements),
        "loop();",
        source(assertionsStatements),
      ])
    );
  };
  /* Generates a complete C++ source file with the test case for given data.
       @param name     a free-form string to use as Catch2 TEST_CASE name
       @param tabData  \m/
       @param idMap    a map from tested pin labels (FOO, IN1, OUT etc) to
                       IDs of corresponding probes in C++ code (0, 1, 2, etc)
       @param probes   \m/
     */
  let generate =
      (
        name: string,
        tabData: TabData.t,
        idMap: Map.String.t(string),
        probes: Probes.t,
      )
      : Cpp.code => {
    let nodeAliases =
      idMap
      |. Map.String.toList
      |. List.map(((name, id)) => {j|auto& probe_$name = xod::node_$id;|j});
    let sections =
      tabData |. TabData.map(record => generateSection(record, probes));
    Cpp.(
      source([
        "#include \"catch.hpp\"",
        "",
        source(nodeAliases),
        "",
        "#define INJECT(probe, value) { \\",
        "        (probe).output_VAL = (value); \\",
        "        (probe).isNodeDirty = true; \\",
        "    }",
        "",
        catch2TestCase(name, ["setup();", source(sections)]),
      ])
    );
  };
};

let generateSuite = (project, patchPathToTest) : XResult.t(t) => {
  let patchUnderTestOpt = Project.getPatchByPath(project, patchPathToTest);
  let tsvOpt = patchUnderTestOpt |. Option.flatMap(Patch.getTabtestContent);
  switch (patchUnderTestOpt, tsvOpt) {
  | (None, _) =>
    Error(
      newError({j|Patch $patchPathToTest does not exist in the project|j}),
    )
  | (_, None) =>
    Error(
      newError(
        {j|Patch $patchPathToTest has no tabular test data attached|j},
      ),
    )
  | (Some(patchUnderTest), Some(tsv)) =>
    let bench = Bench.create(project, patchUnderTest);
    let probes = bench.probes;
    let benchPatchPath = "@/tabtest-bench";
    let tabData = TabData.parse(tsv);
    let sketchFooter = "\n\n#include \"test.inl\"\n";
    Project.assocPatch(project, benchPatchPath, bench.patch)
    |. Holes.Result.flatMap(Transpiler.transpile(_, benchPatchPath))
    |. Holes.Result.map(program => {
         let idMap =
           Holes.Map.String.innerJoin(bench.probeMap, program.nodeIdMap);
         let testCase =
           TestCase.generate(patchPathToTest, tabData, idMap, probes);
         Map.String.empty
         |. Map.String.set("sketch.cpp", program.code ++ sketchFooter)
         |. Map.String.set("test.inl", testCase);
       });
  };
};
