open Belt;

open XodFuncTools;

open XodProject;

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
  let patchPath = (tp: Pin.primitiveDataType, dir: Pin.direction) : string =>
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
    node:
      Node.create(
        patchPath(Pin.getPrimitiveTypeExn(pin), Pin.getDirection(pin)),
      ),
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
               |. Patch.assocLink(link),
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
  let source = children => BeltHoles.String.joinLines(children);
  let indented = children =>
    children |. BeltHoles.String.joinLines |. BeltHoles.String.indent(4);
  let enquote = x => {j|"$x"|j};
  let block = children =>
    ["{", indented(children), "}"] |. BeltHoles.String.joinLines;
  let catch2TestCase = (name, children) =>
    "TEST_CASE(" ++ enquote(name) ++ ") " ++ block(children);
  let requireEqual = (actual, expected) => {j|REQUIRE($actual == $expected);|j};
  let requireIsNan = value => {j|REQUIRE(isnan($value));|j};
};

/* A test case corresponds to TEST_CASE in Catch2 and a single TSV tabtest in XOD. */
module TestCase = {
  /* Formats a tabular value to a valid C++ literal or expression */
  let valueToLiteral = (value: TabData.Value.t) : string =>
    switch (value) {
    | Boolean(true) => "true"
    | Boolean(false) => "false"
    | Pulse(true) => "true /* pulse */"
    | Pulse(false) => "false /* no-pulse */"
    | NaN => "NAN"
    | String(x) =>
      let str = Cpp.enquote(x);
      {j|xod::XStringCString($str)|j};
    | Number(x) when x === infinity => {j|(xod::Number) INFINITY|j}
    | Number(x) when x === neg_infinity => {j|(xod::Number) -INFINITY|j}
    | Number(x) => {j|(xod::Number) $x|j}
    | ApproxNumber(x, exp) =>
      let margin = 10.0 ** float_of_int(exp) /. 2.0;
      {j|Approx((xod::Number) $x).margin($margin)|j};
    | x => {j|$x|j}
    };
  /* Generates a block of code corresponding to a single TSV line check.
     Contains setup, evaluation, and assertion validation. It might
     be wrapped into Catch2 SECTION, the purpose is the same. */
  let generateSection = (record, probes, sectionIndex) : Cpp.code => {
    let injectionStatements =
      probes
      |. Probes.keepInjecting
      |. Probes.map(probe => {
           let name = probe |. Probe.getTargetPin |. Pin.getLabel;
           switch (record |. TabData.Record.get(name)) {
           | Some(Pulse(false)) => {j|// No pulse for $name|j}
           | Some(value) =>
             let literal = valueToLiteral(value);
             {j|INJECT(probe_$name, $literal);|j};
           | None => {j|// No changes for $name|j}
           };
         });
    let setTimeStatement =
      switch (record |. TabData.Record.get(SpecialColumns.time)) {
      | Some(Number(t)) =>
        let time = int_of_float(t);
        {j|mockTime($time);|j};
      | Some(_)
      | None => "mockTime(millis() + 1);"
      };
    let assertionsStatements =
      probes
      |. Probes.keepCapturing
      |. Probes.map(probe => {
           let name = probe |. Probe.getTargetPin |. Pin.getLabel;
           switch (record |. Map.String.get(name)) {
           | Some(NaN) => Cpp.requireIsNan({j|probe_$name.state.lastValue|j})
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
        setTimeStatement,
        sectionIndex == 0 ? "setup();" : "loop();",
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
      tabData
      |. TabData.mapWithIndex((idx, record) =>
           generateSection(record, probes, idx)
         );
    Cpp.(
      source([
        "#include \"catch.hpp\"",
        "#include <XStringFormat.inl>",
        "",
        source(nodeAliases),
        "",
        "#define INJECT(probe, value) \\",
        "        (probe).output_VAL = (value); \\",
        "        (probe).isNodeDirty = true;",
        "",
        catch2TestCase(name, [source(sections)]),
      ])
    );
  };
};

let generatePatchSuite = (project, patchPathToTest) : XResult.t(t) => {
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
    let tabData = TabData.parse(tsv);
    let realPinLabels =
      bench.probeMap |> Map.String.keysToArray |> List.fromArray;
    let testingPinLabels =
      tsv |. TabData.listDataLines |. List.getExn(0) |. TabData.tabSplit;
    let result =
      switch (Validator.validatePinLabels(realPinLabels, testingPinLabels)) {
      | Some(e) => Result.Error(e)
      | None =>
        let benchPatchPath =
          "tabtest-"
          ++ patchPathToTest
          /* to convert "tabtest-@/foo" to "tabtest/local/foo" */
          |> Js.String.replace("-@", "/local");
        let safeBasename =
          PatchPath.getBaseName(patchPathToTest)
          |> Js.String.replace("(", "__")
          |> Js.String.replace(",", "__")
          |> Js.String.replace(")", "");
        let sketchFilename = safeBasename ++ ".sketch.cpp";
        let testFilename = safeBasename ++ ".catch.inl";
        let sketchFooter = {j|\n\n#include "$testFilename"\n|j};
        Project.assocPatch(project, benchPatchPath, bench.patch)
        |. XodArduino.Transpiler.transpile(_, benchPatchPath)
        |. BeltHoles.Result.map(program => {
             let idMap =
               BeltHoles.Map.String.innerJoin(
                 bench.probeMap,
                 program.nodeIdMap,
               );
             let testCase =
               TestCase.generate(patchPathToTest, tabData, idMap, probes);
             Map.String.empty
             |. Map.String.set(sketchFilename, program.code ++ sketchFooter)
             |. Map.String.set(testFilename, testCase);
           });
      };
    result;
  };
};

let generateProjectSuite = project : XResult.t(t) =>
  project
  |. Project.listLocalPatches
  |. List.keep(Patch.hasTabtest)
  |. List.map(Patch.getPath)
  |. List.reduce(Belt.Result.Ok(Map.String.empty), (accFiles, patchPath) =>
       BeltHoles.Result.lift2(
         BeltHoles.Map.String.mergeOverride,
         accFiles,
         generatePatchSuite(project, patchPath),
       )
     );
