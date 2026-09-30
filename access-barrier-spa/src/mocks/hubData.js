const rows = [
  ['ABP-10482','Northstar Health','Gold PPO','Cardiometra','High','Prior authorization','Hub Agent','2h 18m','Needs review',82],
  ['ABP-10491','United Plan','Premier','Immunava','High','Documentation','Field Reimbursement Manager','4h 32m','Assigned',78],
  ['ABP-10473','CareChoice','Standard','Neurovia','Medium','Affordability','Financial Counselor','1d 6h','In progress',64],
  ['ABP-10455','Prime Network','Advantage','Oncotra','High','Step therapy','Hub Agent','3h 12m','Needs review',84],
  ['ABP-10449','HealthPlus','Essential','Cardiometra','Low','Coverage limit','Hub Agent','2d 4h','Open',31],
  ['ABP-10437','Northstar Health','Gold PPO','Dermava','Medium','Documentation','Field Reimbursement Manager','1d 2h','Assigned',57],
  ['ABP-10428','United Plan','Premier','Immunava','High','Prior authorization','Financial Counselor','5h 24m','Needs review',89],
  ['ABP-10411','CareChoice','Standard','Neurovia','Medium','Affordability','Hub Agent','1d 8h','Open',52],
  ['ABP-10398','Prime Network','Advantage','Cardiometra','Low','None identified','Hub Agent','3d 1h','In progress',28],
  ['ABP-10387','HealthPlus','Essential','Oncotra','Medium','Clinical criteria','Field Reimbursement Manager','1d 5h','Assigned',61],
  ['ABP-10372','Northstar Health','Gold PPO','Neurovia','High','Prior authorization','Hub Agent','3h 48m','Needs review',81],
  ['ABP-10361','United Plan','Premier','Dermava','Low','Documentation','Hub Agent','2d 2h','Open',35],
  ['ABP-10343','CareChoice','Standard','Oncotra','Medium','Step therapy','Financial Counselor','1d 11h','In progress',58],
  ['ABP-10328','Prime Network','Advantage','Immunava','High','Coverage limit','Hub Agent','4h 08m','Assigned',76],
  ['ABP-10314','HealthPlus','Essential','Cardiometra','Low','None identified','Hub Agent','2d 10h','Open',23],
  ['ABP-10299','Northstar Health','Gold PPO','Dermava','Medium','Clinical criteria','Field Reimbursement Manager','1d 3h','In progress',63],
  ['ABP-10284','United Plan','Premier','Oncotra','High','Documentation','Hub Agent','2h 52m','Needs review',86],
  ['ABP-10263','CareChoice','Standard','Immunava','Medium','Affordability','Financial Counselor','1d 9h','Assigned',54],
  ['ABP-10250','Prime Network','Advantage','Neurovia','Low','Coverage limit','Hub Agent','2d 1h','Open',39],
  ['ABP-10231','HealthPlus','Essential','Dermava','High','Step therapy','Hub Agent','5h 02m','Needs review',79],
  ['ABP-10217','Northstar Health','Gold PPO','Oncotra','Medium','Documentation','Field Reimbursement Manager','1d 7h','In progress',60],
  ['ABP-10198','United Plan','Premier','Cardiometra','Low','None identified','Hub Agent','3d 2h','Open',22],
  ['ABP-10177','CareChoice','Standard','Dermava','High','Prior authorization','Financial Counselor','3h 26m','Assigned',83],
  ['ABP-10152','Prime Network','Advantage','Immunava','Medium','Clinical criteria','Hub Agent','1d 4h','In progress',56],
]
const explanations = [
  'Prior authorization is required for this therapy under the payer plan.',
  'Recent policy changes indicate additional documentation may be needed.',
  'Patient history indicates a potential step therapy requirement.'
]
export const hubCases = rows.map((r, i) => ({
  id:r[0], payer:r[1], plan:r[2], therapy:r[3], risk:r[4], barrier:r[5], owner:r[6], sla:r[7], status:r[8], score:r[9],
  territory:i===0?'Northeast':['Southeast','Midwest','Northeast'][i%3], prescriber:'PR-••399', patientToken:'PT-••2819', confidence:i===0?94:89-i%8,
  created:'Nov 12, 2024, 10:24 AM', updated:'Nov 12, 2024, 12:18 PM', explanations,
  predictedBarriers:i===0?['Prior authorization','Documentation','Step therapy','Coverage limit']:[r[5],'Documentation'],
  actions:['Verify prior authorization requirements with payer','Request latest chart notes from provider','Review plan-specific documentation criteria'],
  activity:[{title:'Case received',meta:'Today, 10:24 AM'},{title:'Case reviewed',meta:'Today, 11:06 AM'},{title:'Assignment updated',meta:'Today, 12:18 PM'}],
  valid:true
}))
export const invalidCase = { id:'ABP-10512', payer:'Northstar Health', plan:'Gold PPO', therapy:'Cardiometra', territory:'Northeast', patientToken:'PT-••5406', status:'Validation issue', risk:'—', barrier:'Validation issue', issue:'Required case information is missing', valid:false, owner:'Hub Agent', sla:'—' }
export const hubSummary = { open:24, high:7, due:5, exceptions:3, updated:'Last updated 2 min ago' }
export const exceptions = [invalidCase,{...invalidCase,id:'ABP-10508',issue:'Payer plan details need confirmation'},{...invalidCase,id:'ABP-10497',issue:'Prescriber information is incomplete'}]

