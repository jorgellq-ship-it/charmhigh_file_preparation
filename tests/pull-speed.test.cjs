const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

// Exercise the actual single-file app functions without a browser or dependencies.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function sourceOf(name) {
  const start = html.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1, name);
  const end = html.indexOf('\n  }', start);
  return html.slice(start, end + 4);
}
function app() {
  const handlers = {};
  const inputs = {bulkPullSpeed:{value:'25'}, bulkSpeed:{value:'70'}, bulkSkip:{value:'true'}, bulkVacuum:{value:'false'}, bulkVision:{value:'true'}};
  const context = vm.createContext({
    l:pt=>pt, currentLang:'pt', importedDpv:null, feederAssignments:{}, lastRows:[],
    bomFile:null, files:[], fileNameInput:{value:'test'}, MACHINE:{maxX:345,maxY:360},
    PITCH_DEFAULTS:{outros:4}, bulkStatusEl:{textContent:''},
    renderFeederTable(){}, onFeederChange(){},
    document:{
      getElementById:id=>inputs[id],
      querySelectorAll:()=>['speed','pullSpeed','skip','vacuum','vision'].map(field=>({
        dataset:{bulk:field}, addEventListener:(_, fn)=>{handlers[field]=fn;},
      })),
    },
  });
  for(const name of [
    'defaultAssignment','ensureAssignment','computeGroups','legacyGroupKey','groupKey',
    'normalizePartNumber','isFiducialRow','chipSizeOf','inferPitch','normalizeAngle',
    'trimNum','dpvSafeText','safeFileBase','baseNameNoExt','validFeederId','dpvNumber',
    'validPullSpeed','parseEditableDpv','buildImportedDpvString','validateFeederAssignments',
    'componentDpvNote','buildDpvString','feederLibraryIdentityText','feederLibraryAliases',
    'feederLibrarySourceAliases','importFeederLibrary','operatorReportData','operatorReportMarkup','esc',
  ]) vm.runInContext(sourceOf(name), context);
  const start = html.indexOf("  document.querySelectorAll('[data-bulk]')");
  const end = html.indexOf('  // ---------- feeder library', start);
  vm.runInContext(html.slice(start, end), context);
  return {context, handlers, inputs};
}
const stationHeader = 'Table,No.,ID,DeltX,DeltY,FeedRates,Note,Height,Speed,Status,nPixSizeX,nPixSizeY,HeightTake,DelayTake,nPullStripSpeed,nThreshold,nVisualRadio';
const fixture = [
  'separated','FILE,test.dpv','PCBFILE,test.csv',stationHeader,
  'Station,0,1,0.2,-0.3,4,PN-A,1,70,6,10,11,12,13,23,15,16',
  'Station,1,2,0,0,8,PN-B,2,60,1,0,0,0,0,0,0,0',
  'Station,2,3,0,0,4,UNUSED,1,50,0,0,0,0,0,17,0,0',
  'Table,No.,ID,PHead,STNo.,DeltX,DeltY,Angle,Height,Skip,Speed,Explain,Note',
  'EComponent,0,1,1,1,10,20,135,1,6,70,R1,PN-A',
  'EComponent,1,2,1,1,20,20,-45,1,6,70,R2,PN-A',
  'EComponent,2,3,2,2,30,20,90,2,1,60,C1,PN-B',
  'Table,No.,ID,DeltX,DeltY','Panel_Coord,0,1,0,0,0',
  'CustomMachineData,keep,this,exactly','',
].join('\r\n');
function load(context, text=fixture) {
  context.importedDpv = context.parseEditableDpv(text, 'test.dpv');
  context.feederAssignments = context.importedDpv.assignments;
  context.lastRows = context.importedDpv.rows;
  return Object.keys(context.feederAssignments);
}
const records = (text, type)=>text.split(/\r?\n/).filter(line=>line.startsWith(type+',')).map(line=>line.split(','));

test('import/export preserves per-feeder Pull Speed, placement data and other machine tables', ()=>{
  const {context:c} = app();
  const [a,b] = load(c);
  assert.equal(c.feederAssignments[a].pullSpeed, '23');
  assert.equal(c.feederAssignments[b].pullSpeed, '0');
  const output = c.buildDpvString(c.lastRows, 'edited');
  assert.deepEqual(records(output,'Station'), records(fixture,'Station'));
  assert.deepEqual(records(output,'EComponent'), records(fixture,'EComponent'));
  assert.ok(output.includes('CustomMachineData,keep,this,exactly\r\n'));
  assert.ok(output.endsWith('\r\n'));
});

test('bulk edit updates active groups only; removed and unused stations stay unchanged', ()=>{
  const {context:c, handlers, inputs} = app();
  const [a,b] = load(c);
  c.feederAssignments[b].remove = true;
  inputs.bulkPullSpeed.value = '40';
  handlers.pullSpeed();
  assert.equal(c.feederAssignments[a].pullSpeed, 40);
  assert.equal(c.feederAssignments[b].pullSpeed, '0');
  assert.match(c.bulkStatusEl.textContent, /1 componente/);
  const output = c.buildDpvString(c.lastRows, 'edited');
  assert.deepEqual(records(output,'Station').map(r=>r[14]), ['40','0','17']);
  assert.deepEqual(records(output,'EComponent'), records(fixture,'EComponent').slice(0,2));
  c.feederAssignments[b].remove = false;
  inputs.bulkPullSpeed.value = '0';
  handlers.pullSpeed();
  assert.deepEqual(records(c.buildDpvString(c.lastRows,'edited'),'Station').map(r=>r[14]), ['0','0','17']);
});

test('invalid bulk values never alter assignments; invalid per-row values block DPV export', ()=>{
  const {context:c, handlers, inputs} = app();
  const [a] = load(c);
  for(const invalid of ['', '-1', '1.5', 'abc', 'Infinity', '9007199254740992']) {
    inputs.bulkPullSpeed.value = invalid;
    handlers.pullSpeed();
    assert.match(c.bulkStatusEl.textContent, /Pull Speed inválido/);
    assert.equal(c.feederAssignments[a].pullSpeed, '23');
    c.feederAssignments[a].pullSpeed = invalid;
    assert.throws(()=>c.buildDpvString(c.lastRows,'edited'), /Pull Speed inválido/);
    c.feederAssignments[a].pullSpeed = '23';
  }
});

test('old feeder libraries keep existing Pull Speed; new ones restore it including zero', ()=>{
  const {context:c} = app();
  const [a] = load(c);
  assert.equal(c.importFeederLibrary({[a]:{feederID:'1', speed:70}}).applied, 1);
  assert.equal(c.feederAssignments[a].pullSpeed, '23');
  for(const pullSpeed of [0,35]) {
    const saved = JSON.parse(JSON.stringify({format:'charmhigh-feeder-library', version:2, assignments:{[a]:{...c.feederAssignments[a], pullSpeed}}}));
    c.importFeederLibrary(saved);
    assert.equal(c.feederAssignments[a].pullSpeed, pullSpeed);
    assert.equal(records(c.buildDpvString(c.lastRows,'edited'),'Station')[0][14], String(pullSpeed));
  }
});

test('legacy short Station rows and header gain the Pull Speed column', ()=>{
  const {context:c} = app();
  const legacy = fixture.split('\r\n').map(line=>line===stationHeader || line.startsWith('Station,') ? line.split(',').slice(0,14).join(',') : line).join('\r\n');
  const [a] = load(c, legacy);
  assert.equal(c.feederAssignments[a].pullSpeed, 0);
  c.feederAssignments[a].pullSpeed = 12;
  const output = c.buildDpvString(c.lastRows,'edited');
  assert.ok(output.includes('DelayTake,nPullStripSpeed\r\n'));
  assert.equal(records(output,'Station')[0][14], '12');
});

test('new CSV-derived DPVs serialize Pull Speed and still require explicit feeder positions', ()=>{
  const {context:c, handlers, inputs} = app();
  c.lastRows = [
    {Designator:'R1',Footprint:'R_0603',Comment:'1K','Part Number':'PN-1-PERCENT','Mid X':'10','Mid Y':'20',Rotation:'135'},
    {Designator:'R2',Footprint:'R_0603',Comment:'1K','Part Number':'PN-HALF-PERCENT','Mid X':'20','Mid Y':'20',Rotation:'90'},
  ];
  const keys = Object.keys(c.computeGroups(c.lastRows));
  assert.equal(keys.length,2);
  inputs.bulkPullSpeed.value = '30';
  handlers.pullSpeed();
  assert.throws(()=>c.buildDpvString(c.lastRows,'new'), /sem posição/);
  keys.forEach((key,i)=>{c.feederAssignments[key].feederID=String(i+1);});
  const output = c.buildDpvString(c.lastRows,'new');
  assert.deepEqual(records(output,'Station').map(r=>r[14]), ['30','30']);
  assert.deepEqual(records(output,'EComponent').map(r=>r[7]), ['45','0']);
  assert.deepEqual(records(output,'EComponent').map(r=>r[10]), ['100','100']);
  const data = c.operatorReportData(c.lastRows);
  assert.deepEqual(Array.from(data.entries,entry=>entry.pullSpeed), ['30','30']);
  assert.match(c.operatorReportMarkup(data), /Pull Speed: <strong>30<\/strong>/);
});

test('existing bulk controls remain independent of Pull Speed', ()=>{
  const {context:c, handlers} = app();
  const keys = load(c);
  handlers.speed(); handlers.skip(); handlers.vacuum(); handlers.vision();
  assert.deepEqual(keys.map(key=>c.feederAssignments[key].pullSpeed), ['23','0']);
  for(const key of keys) {
    assert.equal(c.feederAssignments[key].speed,70);
    assert.equal(c.feederAssignments[key].skip,true);
    assert.equal(c.feederAssignments[key].vacuum,false);
    assert.equal(c.feederAssignments[key].vision,true);
  }
});
