/* Independent exercise engine. Exact decimal arithmetic for the specification. */
(function(root){
'use strict';
const labels={equilateral:'Равносторонний',isosceles:'Равнобедренный',scalene:'Разносторонний',none:'Треугольник не существует',invalid:'Некорректный ввод'};
const SCALE=10n**18n,MAX=1000000000n*SCALE;
function parse(s){if(String(s).length>128)return null;s=String(s).trim();if(!/^\d+(?:[.,]\d{1,18})?$/.test(s)||s.length>128)return null;let [a,b='']=s.replace(',','.').split('.');const v=BigInt(a)*SCALE+BigInt(b.padEnd(18,'0'));return v>0n&&v<=MAX?v:null;}
function classify(v,allowFlat=false){if(v.some(x=>x===null))return 'invalid';let t=[...v].sort((a,b)=>a<b?-1:a>b?1:0);if(allowFlat?t[0]+t[1]<t[2]:t[0]+t[1]<=t[2])return 'none';if(v[0]===v[1]&&v[1]===v[2])return 'equilateral';return v[0]===v[1]||v[1]===v[2]||v[0]===v[2]?'isosceles':'scalene';}
const oracle=s=>classify(s.map(parse));
const bugs=[
{id:'flat',title:'Вырожденный треугольник',why:'Сумма двух меньших сторон должна быть строго больше третьей. Равенство даёт отрезок.',sample:['1','2','3']},
{id:'order',title:'Зависимость от порядка сторон',why:'Проверяются не все неравенства. Перестановка сторон не должна менять результат.',sample:['8','2','3']},
{id:'equal',title:'Две равные стороны приняты за три',why:'Равносторонний треугольник требует равенства всех трёх сторон.',sample:['5','5','6']},
{id:'fraction',title:'Дробная часть потеряна',why:'Длины округляются вниз до классификации, поэтому меняется тип или существование треугольника.',sample:['2.1','2.2','2.3']},
{id:'text',title:'Число с мусором принято',why:'Частичный разбор строки принимает числовой префикс. Вся строка должна соответствовать формату.',sample:['3abc','4','5']},
{id:'zero',title:'Нулевая длина принята',why:'Положительность должна проверяться раньше определения типа, в том числе когда все значения равны.',sample:['0','0','0']},
{id:'limit',title:'Верхняя граница исключена',why:'Значение 1 000 000 000 допустимо: ограничение включительное.',sample:['1000000000','1000000000','1000000000']},
{id:'empty',title:'Пустое поле заменено единицей',why:'У пустого поля нет длины. Значение по умолчанию скрывает ошибку ввода.',sample:['','1','1']},
{id:'precision',title:'Потеря точности чисел',why:'Преобразование в двоичный Number стирает малое различие сторон. По спецификации сравнение десятичных значений точное.',sample:['1','1','1.000000000000000001']}
];
function actual(s,id){const ref=oracle(s),v=s.map(parse);switch(id){
case 'flat':return classify(v,true);
case 'order':if(v.some(x=>x===null))return 'invalid';if(v[0]+v[1]<=v[2])return 'none';return v[0]===v[1]&&v[1]===v[2]?'equilateral':v[0]===v[1]||v[1]===v[2]||v[0]===v[2]?'isosceles':'scalene';
case 'equal':return ref==='isosceles'?'equilateral':ref;
case 'fraction':return v.some(x=>x===null)?ref:classify(v.map(x=>x/SCALE*SCALE));
case 'text':return oracle(s.map(x=>String(parseFloat(String(x).replace(',','.')))));
case 'zero':return s.every(x=>String(x).trim()==='0')?'equilateral':ref;
case 'limit':return v.some(x=>x===MAX)?'invalid':ref;
case 'empty':return oracle(s.map(x=>String(x).trim()===''?'1':x));
case 'precision':return v.some(x=>x===null)?ref:classify(s.map(x=>Number(String(x).trim().replace(',','.'))));
default:return ref;}}
const cases=[
['equilateral','Три равные стороны','Классы эквивалентности',['5','5','5'],'equilateral'],
['isos-ab','Равны A и B','Классы эквивалентности',['5','5','6'],'isosceles'],
['isos-ac','Равны A и C','Перестановки',['5','6','5'],'isosceles'],
['isos-bc','Равны B и C','Перестановки',['6','5','5'],'isosceles'],
['scalene','Три разные стороны','Классы эквивалентности',['3','4','5'],'scalene'],
['flat-c','A + B = C','Границы',['1','2','3'],'none'],
['flat-a','B + C = A','Перестановки',['3','1','2'],'none'],
['flat-b','A + C = B','Перестановки',['1','3','2'],'none'],
['long-c','C больше суммы A и B','Геометрия',['2','3','8'],'none'],
['long-a','A больше суммы B и C','Геометрия',['8','2','3'],'none'],
['long-b','B больше суммы A и C','Геометрия',['2','8','3'],'none'],
['near-in','Чуть внутри границы','Границы',['1','2','2.999999999999999999'],'scalene'],
['near-out','Чуть за границей','Границы',['1','2','3.000000000000000001'],'none'],
['zero','Одна нулевая сторона','Неверный ввод',['0','2','2'],'invalid'],
['zeros','Все стороны нулевые','Неверный ввод',['0','0','0'],'invalid'],
['negative','Отрицательная сторона','Неверный ввод',['-3','4','5'],'invalid'],
['empty','Пустое поле','Неверный ввод',['','1','1'],'invalid'],
['spaces-only','Только пробелы','Неверный ввод',['   ','4','5'],'invalid'],
['letters','Буквы вместо длины','Неверный ввод',['abc','4','5'],'invalid'],
['suffix','Мусор после числа','Неверный ввод',['3abc','4','5'],'invalid'],
['special','Спецсимволы / HTML','Неверный ввод',['<script>alert(1)</script>','4','5'],'invalid'],
['dot','Дроби с точкой','Формат',['2.1','2.2','2.3'],'scalene'],
['comma','Дроби с запятой','Формат',['2,1','2,2','2,3'],'scalene'],
['trim','Пробелы вокруг числа','Формат',[' 3 ','4','5'],'scalene'],
['leading','Ведущие нули','Формат',['003','04','005'],'scalene'],
['exponent','Экспоненциальная запись','Формат',['3e0','4','5'],'invalid'],
['infinity','Бесконечность','Неверный ввод',['Infinity','4','5'],'invalid'],
['nan','NaN','Неверный ввод',['NaN','4','5'],'invalid'],
['max','Верхняя граница включительно','Границы',['1000000000','1000000000','1000000000'],'equilateral'],
['over-max','Выше верхней границы','Границы',['1000000000.000000000000000001','1','1'],'invalid'],
['min','Минимальная положительная длина','Границы',['0.000000000000000001','0.000000000000000001','0.000000000000000001'],'equilateral'],
['precision','18 знаков после разделителя','Точность',['1','1','1.000000000000000001'],'isosceles'],
['over-precision','Больше 18 дробных знаков','Точность',['1.0000000000000000001','1','1'],'invalid'],
['two-separators','Два разделителя','Формат',['1.2.3','4','5'],'invalid'],
['plus','Знак плюс','Формат',['+3','4','5'],'invalid'],
['missing-integer','Нет целой части','Формат',['.5','1','1'],'invalid']
].map(([id,title,group,input,expected])=>({id,title,group,input,expected}));
function coverage(s){
const raw=s.map(String), t=raw.map(x=>x.trim()),v=s.map(parse),ok=v.every(x=>x!==null),r=oracle(s),validTriangle=ok&&r!=='none';
const has=f=>t.some(f), delta=ok?[v[1]+v[2]-v[0],v[0]+v[2]-v[1],v[0]+v[1]-v[2]]:[];
const rules={
'equilateral':r==='equilateral','isos-ab':r==='isosceles'&&v[0]===v[1],'isos-ac':r==='isosceles'&&v[0]===v[2],'isos-bc':r==='isosceles'&&v[1]===v[2],'scalene':r==='scalene',
'flat-c':ok&&delta[2]===0n,'flat-a':ok&&delta[0]===0n,'flat-b':ok&&delta[1]===0n,
'long-c':ok&&delta[2]<0n,'long-a':ok&&delta[0]<0n,'long-b':ok&&delta[1]<0n,
'near-in':ok&&delta.some(x=>x>0n&&x<=1000n),'near-out':ok&&delta.some(x=>x<0n&&x>=-1000n),
'zero':t.filter(x=>/^0+(?:[.,]0+)?$/.test(x)).length===1,'zeros':t.every(x=>/^0+(?:[.,]0+)?$/.test(x)),
'negative':has(x=>/^-\d/.test(x)),'empty':raw.some(x=>x===''),'spaces-only':raw.some(x=>x.length>0&&x.trim()===''),
'letters':has(x=>/^[a-zA-Z]+$/.test(x)&&!['NaN','Infinity'].includes(x)),
'suffix':has(x=>/^\d+(?:[.,]\d+)?[a-df-zA-DF-Z]+/.test(x)),
'special':has(x=>/[<>"'&]/.test(x)),'dot':validTriangle&&has(x=>/^\d+\.\d+$/.test(x)),
'comma':validTriangle&&has(x=>/^\d+,\d+$/.test(x)),'trim':ok&&raw.some((x,i)=>x!==t[i]),
'leading':ok&&has(x=>/^0\d/.test(x)),'exponent':has(x=>/^\d+(?:\.\d+)?[eE][+-]?\d+$/.test(x)),
'infinity':has(x=>/^[+-]?Infinity$/.test(x)),'nan':has(x=>x==='NaN'),'max':ok&&v.some(x=>x===MAX),
'over-max':has(x=>{if(!/^\d+(?:[.,]\d{1,18})?$/.test(x))return false;let [a,b='']=x.replace(',','.').split('.');return BigInt(a)*SCALE+BigInt(b.padEnd(18,'0'))>MAX;}),
'min':ok&&v.some(x=>x===1n),'precision':ok&&has(x=>/[.,]\d{18}$/.test(x)),
'over-precision':has(x=>/[.,]\d{19,}$/.test(x)),'two-separators':has(x=>(x.match(/[.,]/g)||[]).length>1),
'plus':has(x=>/^\+\d/.test(x)),'missing-integer':has(x=>/^[.,]\d+$/.test(x))};
return Object.entries(rules).filter(([,value])=>value).map(([id])=>id);
}
const api={labels,parse,oracle,actual,bugs,cases,coverage};root.Triangle=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
