var e=Object.defineProperty,t=Object.defineProperties,n=Object.getOwnPropertyDescriptors,s=Object.getOwnPropertySymbols,a=Object.prototype.hasOwnProperty,r=Object.prototype.propertyIsEnumerable,c=(t,n,s)=>n in t?e(t,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[n]=s,l=(e,t)=>{for(var n in t||(t={}))a.call(t,n)&&c(e,n,t[n]);if(s)for(var n of s(t))r.call(t,n)&&c(e,n,t[n]);return e};import{S as o,i,s as f,j as $,m as h,o as p,v as m,r as d,w as u,z as g,l as w,f as k,B as y,u as v,d as x,I as b,J as j,e as E,c as _,a as D,b as O,a0 as T,a7 as S,a8 as I,k as P,n as V,D as H,L as A,t as B,g as C,h as L,H as N,G as R,V as G,a9 as q,ad as z,ae as J}from"../../../chunks/vendor-483ca6b6.js";import{s as Y}from"../../../chunks/auth-c13ad024.js";import{I as F,g as K,s as M}from"../../../chunks/_transitions-34f54501.js";import{C as Q,S as U}from"../../../chunks/Spinner-460fa24f.js";import{C as W}from"../../../chunks/Checkbox-6f8586bf.js";import{S as X}from"../../../chunks/Select-2b3a6ae9.js";import{m as Z}from"../../../chunks/store-b327666d.js";import{S as ee}from"../../../chunks/Section-69710e66.js";import"../../../chunks/store-97111950.js";import"../../../chunks/store-a8f0f898.js";function te(e,t,n){const s=e.slice();return s[24]=t[n],s[25]=t,s[26]=n,s}function ne(e,t,n){const s=e.slice();return s[27]=t[n].key,s}function se(e,t,n){const s=e.slice();return s[30]=t[n].title,s}function ae(e){let t,n,s,a,r,c,l,o,i,f,g,T;function S(t){e[15](t)}let I={options:e[4],class:"flex-grow-0"};void 0!==e[1]&&(I.value=e[1]),n=new X({props:I}),b.push((()=>j(n,"value",S))),n.$on("change",e[11]);let B=e[8]&&ce(e),C=e[7]&&oe(e);i=new F({props:{type:"link",href:"./roles/add",$$slots:{default:[fe]},$$scope:{ctx:e}}});let L=""!==e[1]&&$e(e);return{c(){t=E("div"),$(n.$$.fragment),a=P(),r=E("div"),c=E("div"),B&&B.c(),l=P(),C&&C.c(),o=P(),$(i.$$.fragment),f=P(),L&&L.c(),g=w(),this.h()},l(e){t=_(e,"DIV",{class:!0});var s=D(t);h(n.$$.fragment,s),a=V(s),r=_(s,"DIV",{class:!0});var $=D(r);c=_($,"DIV",{class:!0});var p=D(c);B&&B.l(p),l=V(p),C&&C.l(p),o=V(p),h(i.$$.fragment,p),p.forEach(x),$.forEach(x),s.forEach(x),f=V(e),L&&L.l(e),g=w(),this.h()},h(){O(c,"class","flex space-x-[8px]"),O(r,"class","flex justify-end"),O(t,"class","flex justify-between w-full items-center space-x-[16px]")},m(e,s){k(e,t,s),p(n,t,null),H(t,a),H(t,r),H(r,c),B&&B.m(c,null),H(c,l),C&&C.m(c,null),H(c,o),p(i,c,null),k(e,f,s),L&&L.m(e,s),k(e,g,s),T=!0},p(e,t){const a={};16&t[0]&&(a.options=e[4]),!s&&2&t[0]&&(s=!0,a.value=e[1],A((()=>s=!1))),n.$set(a),e[8]?B?(B.p(e,t),256&t[0]&&m(B,1)):(B=ce(e),B.c(),m(B,1),B.m(c,l)):B&&(y(),d(B,1,1,(()=>{B=null})),v()),e[7]?C?(C.p(e,t),128&t[0]&&m(C,1)):(C=oe(e),C.c(),m(C,1),C.m(c,o)):C&&(y(),d(C,1,1,(()=>{C=null})),v());const r={};4&t[1]&&(r.$$scope={dirty:t,ctx:e}),i.$set(r),""!==e[1]?L?(L.p(e,t),2&t[0]&&m(L,1)):(L=$e(e),L.c(),m(L,1),L.m(g.parentNode,g)):L&&(y(),d(L,1,1,(()=>{L=null})),v())},i(e){T||(m(n.$$.fragment,e),m(B),m(C),m(i.$$.fragment,e),m(L),T=!0)},o(e){d(n.$$.fragment,e),d(B),d(C),d(i.$$.fragment,e),d(L),T=!1},d(e){e&&x(t),u(n),B&&B.d(),C&&C.d(),u(i),e&&x(f),L&&L.d(e),e&&x(g)}}}function re(e){let t,n;return t=new U({}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p:R,i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}function ce(e){let t,n,s,a,r;return n=new F({props:{theme:"success",$$slots:{default:[le]},$$scope:{ctx:e}}}),n.$on("click",e[12]),{c(){t=E("div"),$(n.$$.fragment),this.h()},l(e){t=_(e,"DIV",{class:!0});var s=D(t);h(n.$$.fragment,s),s.forEach(x),this.h()},h(){O(t,"class","flex")},m(e,s){k(e,t,s),p(n,t,null),r=!0},p(e,t){const s={};4&t[1]&&(s.$$scope={dirty:t,ctx:e}),n.$set(s)},i(e){r||(m(n.$$.fragment,e),T((()=>{a&&a.end(1),s||(s=S(t,K,{})),s.start()})),r=!0)},o(e){d(n.$$.fragment,e),s&&s.invalidate(),a=I(t,M,{}),r=!1},d(e){e&&x(t),u(n),e&&a&&a.end()}}}function le(e){let t,n;return t=new G({props:{src:q,class:"w-[24px] h-[24px]"}}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p:R,i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}function oe(e){let t,n,s,a,r;return n=new F({props:{theme:"error",$$slots:{default:[ie]},$$scope:{ctx:e}}}),n.$on("click",e[10]),{c(){t=E("div"),$(n.$$.fragment),this.h()},l(e){t=_(e,"DIV",{class:!0});var s=D(t);h(n.$$.fragment,s),s.forEach(x),this.h()},h(){O(t,"class","flex")},m(e,s){k(e,t,s),p(n,t,null),r=!0},p(e,t){const s={};4&t[1]&&(s.$$scope={dirty:t,ctx:e}),n.$set(s)},i(e){r||(m(n.$$.fragment,e),T((()=>{a&&a.end(1),s||(s=S(t,K,{})),s.start()})),r=!0)},o(e){d(n.$$.fragment,e),s&&s.invalidate(),a=I(t,M,{}),r=!1},d(e){e&&x(t),u(n),e&&a&&a.end()}}}function ie(e){let t,n;return t=new G({props:{src:z,class:"w-[24px] h-[24px]"}}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p:R,i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}function fe(e){let t,n;return t=new G({props:{src:J,class:"w-[24px] h-[24px]"}}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p:R,i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}function $e(e){let t,n,s,a,r,c,l,o,i,f;function g(t){e[16](t)}function w(t){e[17](t)}let T={};void 0!==e[5]&&(T.checked=e[5]),void 0!==e[6]&&(T.indeterminate=e[6]),a=new W({props:T}),b.push((()=>j(a,"checked",g))),b.push((()=>j(a,"indeterminate",w))),a.$on("change",e[9]);let S=e[0],I=[];for(let $=0;$<S.length;$+=1)I[$]=he(se(e,S,$));let B=e[2],C=[];for(let $=0;$<B.length;$+=1)C[$]=me(te(e,B,$));const L=e=>d(C[e],1,1,(()=>{C[e]=null}));return{c(){t=E("table"),n=E("thead"),s=E("th"),$(a.$$.fragment),l=P();for(let e=0;e<I.length;e+=1)I[e].c();o=P(),i=E("tbody");for(let e=0;e<C.length;e+=1)C[e].c();this.h()},l(e){t=_(e,"TABLE",{class:!0});var r=D(t);n=_(r,"THEAD",{});var c=D(n);s=_(c,"TH",{class:!0});var f=D(s);h(a.$$.fragment,f),f.forEach(x),l=V(c);for(let t=0;t<I.length;t+=1)I[t].l(c);c.forEach(x),o=V(r),i=_(r,"TBODY",{});var $=D(i);for(let t=0;t<C.length;t+=1)C[t].l($);$.forEach(x),r.forEach(x),this.h()},h(){O(s,"class",we+" w-[24px]"),O(t,"class","w-full")},m(e,r){k(e,t,r),H(t,n),H(n,s),p(a,s,null),H(n,l);for(let t=0;t<I.length;t+=1)I[t].m(n,null);H(t,o),H(t,i);for(let t=0;t<C.length;t+=1)C[t].m(i,null);f=!0},p(e,t){const s={};if(!r&&32&t[0]&&(r=!0,s.checked=e[5],A((()=>r=!1))),!c&&64&t[0]&&(c=!0,s.indeterminate=e[6],A((()=>c=!1))),a.$set(s),1&t[0]){let s;for(S=e[0],s=0;s<S.length;s+=1){const a=se(e,S,s);I[s]?I[s].p(a,t):(I[s]=he(a),I[s].c(),I[s].m(n,null))}for(;s<I.length;s+=1)I[s].d(1);I.length=S.length}if(5&t[0]){let n;for(B=e[2],n=0;n<B.length;n+=1){const s=te(e,B,n);C[n]?(C[n].p(s,t),m(C[n],1)):(C[n]=me(s),C[n].c(),m(C[n],1),C[n].m(i,null))}for(y(),n=B.length;n<C.length;n+=1)L(n);v()}},i(e){if(!f){m(a.$$.fragment,e);for(let e=0;e<B.length;e+=1)m(C[e]);f=!0}},o(e){d(a.$$.fragment,e),C=C.filter(Boolean);for(let t=0;t<C.length;t+=1)d(C[t]);f=!1},d(e){e&&x(t),u(a),N(I,e),N(C,e)}}}function he(e){let t,n,s=e[30]+"";return{c(){t=E("th"),n=B(s),this.h()},l(e){t=_(e,"TH",{class:!0});var a=D(t);n=C(a,s),a.forEach(x),this.h()},h(){O(t,"class",we)},m(e,s){k(e,t,s),H(t,n)},p(e,t){1&t[0]&&s!==(s=e[30]+"")&&L(n,s)},d(e){e&&x(t)}}}function pe(e){let t,n,s=(e[27]in e[24]?e[24][e[27]]:"")+"";return{c(){t=E("td"),n=B(s),this.h()},l(e){t=_(e,"TD",{class:!0});var a=D(t);n=C(a,s),a.forEach(x),this.h()},h(){O(t,"class",we)},m(e,s){k(e,t,s),H(t,n)},p(e,t){5&t[0]&&s!==(s=(e[27]in e[24]?e[24][e[27]]:"")+"")&&L(n,s)},d(e){e&&x(t)}}}function me(e){let t,n,s,a,r,c,l,o;function i(t){e[18](t,e[24])}let f={};void 0!==e[24].checked&&(f.checked=e[24].checked),s=new W({props:f}),b.push((()=>j(s,"checked",i)));let g=e[0],w=[];for(let $=0;$<g.length;$+=1)w[$]=pe(ne(e,g,$));return{c(){t=E("tr"),n=E("td"),$(s.$$.fragment),r=P();for(let e=0;e<w.length;e+=1)w[e].c();c=P(),this.h()},l(e){t=_(e,"TR",{id:!0});var a=D(t);n=_(a,"TD",{class:!0});var l=D(n);h(s.$$.fragment,l),l.forEach(x),r=V(a);for(let t=0;t<w.length;t+=1)w[t].l(a);c=V(a),a.forEach(x),this.h()},h(){O(n,"class",we),O(t,"id",l=e[24]._id)},m(e,a){k(e,t,a),H(t,n),p(s,n,null),H(t,r);for(let n=0;n<w.length;n+=1)w[n].m(t,null);H(t,c),o=!0},p(n,r){e=n;const i={};if(!a&&4&r[0]&&(a=!0,i.checked=e[24].checked,A((()=>a=!1))),s.$set(i),5&r[0]){let n;for(g=e[0],n=0;n<g.length;n+=1){const s=ne(e,g,n);w[n]?w[n].p(s,r):(w[n]=pe(s),w[n].c(),w[n].m(t,c))}for(;n<w.length;n+=1)w[n].d(1);w.length=g.length}(!o||4&r[0]&&l!==(l=e[24]._id))&&O(t,"id",l)},i(e){o||(m(s.$$.fragment,e),o=!0)},o(e){d(s.$$.fragment,e),o=!1},d(e){e&&x(t),u(s),N(w,e)}}}function de(e){let t,n,s,a;const r=[re,ae],c=[];function l(e,t){return e[3]?1:0}return t=l(e),n=c[t]=r[t](e),{c(){n.c(),s=w()},l(e){n.l(e),s=w()},m(e,n){c[t].m(e,n),k(e,s,n),a=!0},p(e,a){let o=t;t=l(e),t===o?c[t].p(e,a):(y(),d(c[o],1,1,(()=>{c[o]=null})),v(),n=c[t],n?n.p(e,a):(n=c[t]=r[t](e),n.c()),m(n,1),n.m(s.parentNode,s))},i(e){a||(m(n),a=!0)},o(e){d(n),a=!1},d(e){c[t].d(e),e&&x(s)}}}function ue(e){let t,n;return t=new Q({props:{class:"items-center space-y-[16px]",$$slots:{default:[de]},$$scope:{ctx:e}}}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p(e,n){const s={};511&n[0]|4&n[1]&&(s.$$scope={dirty:n,ctx:e}),t.$set(s)},i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}function ge(e){let t,n;return t=new ee({props:{class:"space-y-[16px]",$$slots:{default:[ue]},$$scope:{ctx:e}}}),{c(){$(t.$$.fragment)},l(e){h(t.$$.fragment,e)},m(e,s){p(t,e,s),n=!0},p(e,n){const s={};511&n[0]|4&n[1]&&(s.$$scope={dirty:n,ctx:e}),t.$set(s)},i(e){n||(m(t.$$.fragment,e),n=!0)},o(e){d(t.$$.fragment,e),n=!1},d(e){u(t,e)}}}const we="p-[10px]";function ke(e,s,a){let r,c,o,i,f;const $=async()=>{Z.spinner.show(),await Y({method:"DELETE",href:`/api/datatable/roles?_id=${v}`}),a(1,v=""),await p(),Z.spinner.hide()},h=async()=>{const e=await Y("/api/datatable/routes");a(2,x=e.rows.map((e=>Object.assign({checked:!1},e))))},p=async()=>{const e=await Y("/api/datatable/roles");k=e.rows,a(4,y=[{value:"",label:"Select a Role"},...e.rows.map((e=>l({value:e._id,label:e.name},e)))])},m=()=>{a(2,x=[...x].map((e=>{return s=l({},e),t(s,n({checked:!1}));var s})))};let{columns:d=[{title:"Group",key:"group"},{title:"Name",key:"name"},{title:"Route",key:"href"}]}=s,u=!1,w=[],k=[],y=[],v="",x=[];return g((async()=>{await Promise.all([h(),p()]),a(3,u=!0)})),e.$$set=e=>{"columns"in e&&a(0,d=e.columns)},e.$$.update=()=>{4&e.$$.dirty[0]&&a(14,r=[...x].filter((e=>e.checked))),16388&e.$$.dirty[0]&&a(5,c=r.length===x.length),16388&e.$$.dirty[0]&&a(6,o=0!==r.length&&r.length!==x.length),2&e.$$.dirty[0]&&a(7,i=""!==v),8198&e.$$.dirty[0]&&a(8,f=""!==v&&[...x].filter((e=>e.checked)).map((e=>e._id)).sort().join(",")!==[...w].map((e=>e._id)).sort().join(","))},[d,v,x,u,y,c,o,i,f,async()=>{a(2,x=x.map((e=>(e.checked=!c,e))))},()=>{Z.confirmation.show(`Are you sure you want to delete role "${k.filter((e=>e._id===v))[0].name}"?`,$)},async()=>{if(m(),""!==v){Z.spinner.show();const e=await Y(`/api/datatable/roles?_id=${v}`),t=e.rows[0].routes.map((e=>e._id));a(13,w=[...e.rows[0].routes]),a(2,x=x.map((e=>(e.checked=!!t.includes(e._id),e)))),Z.spinner.hide()}else a(13,w=[])},async()=>{Z.spinner.show();const e=[...r].map((e=>(delete e.checked,e))),t=await Y({method:"PATCH",href:`/api/datatable/roles?_id=${v}`,body:{routes:e}}),n=t.doc.routes.map((e=>e._id));a(13,w=[...t.doc.routes]),a(2,x=x.map((e=>(e.checked=!!n.includes(e._id),e)))),Z.spinner.hide()},w,r,function(e){v=e,a(1,v)},function(e){c=e,a(5,c),a(14,r),a(2,x)},function(e){o=e,a(6,o),a(14,r),a(2,x)},function(t,n){e.$$.not_equal(n.checked,t)&&(n.checked=t,a(2,x))}]}export default class extends o{constructor(e){super(),i(this,e,ke,ge,f,{columns:0},[-1,-1])}}
