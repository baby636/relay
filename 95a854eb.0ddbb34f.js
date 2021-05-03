(window.webpackJsonp=window.webpackJsonp||[]).push([[637],{1142:function(e,t,n){"use strict";n.d(t,"a",(function(){return u})),n.d(t,"b",(function(){return m}));var r=n(0),o=n.n(r);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=o.a.createContext({}),p=function(e){var t=o.a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},u=function(e){var t=p(e.components);return o.a.createElement(l.Provider,{value:t},e.children)},b={inlineCode:"code",wrapper:function(e){var t=e.children;return o.a.createElement(o.a.Fragment,{},t)}},d=o.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,i=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),u=p(n),d=r,m=u["".concat(i,".").concat(d)]||u[d]||b[d]||a;return n?o.a.createElement(m,c(c({ref:t},l),{},{components:n})):o.a.createElement(m,c({ref:t},l))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,i=new Array(a);i[0]=d;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:r,i[1]=c;for(var l=2;l<a;l++)i[l]=n[l];return o.a.createElement.apply(null,i)}return o.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},721:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return i})),n.d(t,"metadata",(function(){return c})),n.d(t,"toc",(function(){return s})),n.d(t,"default",(function(){return p}));var r=n(3),o=n(8),a=(n(0),n(1142)),i={id:"upgrading-to-relay-hooks",title:"Upgrading to Relay Hooks",slug:"/migration-and-compatibility/"},c={unversionedId:"migration-and-compatibility/upgrading-to-relay-hooks",id:"version-v11.0.0/migration-and-compatibility/upgrading-to-relay-hooks",isDocsHomePage:!1,title:"Upgrading to Relay Hooks",description:"Relay Hooks is a set of new Hooks-based APIs for using Relay with React that improves upon the existing container-based APIs.",source:"@site/versioned_docs/version-v11.0.0/migration-and-compatibility/upgrading-to-relay-hooks.md",slug:"/migration-and-compatibility/",permalink:"/docs/migration-and-compatibility/",editUrl:"https://github.com/facebook/relay/edit/master/website/versioned_docs/version-v11.0.0/migration-and-compatibility/upgrading-to-relay-hooks.md",version:"v11.0.0",lastUpdatedBy:"Jordan Eldredge",lastUpdatedAt:1620060051,sidebar:"version-v11.0.0/docs",previous:{title:"Testing Relay with Preloaded Queries",permalink:"/docs/guides/testing-relay-with-preloaded-queries/"},next:{title:"Suspense Compatibility",permalink:"/docs/migration-and-compatibility/suspense-compatibility/"}},s=[{value:"Accessing Relay Hooks",id:"accessing-relay-hooks",children:[]},{value:"Next Steps",id:"next-steps",children:[]}],l={toc:s};function p(e){var t=e.components,n=Object(o.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},l,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"/blog/2021/03/09/introducing-relay-hooks"}),"Relay Hooks")," is a set of new Hooks-based APIs for using Relay with React that improves upon the existing container-based APIs."),Object(a.b)("p",null,"In this we will cover how to start using Relay Hooks, what you need to know about compatibility, and how to migrate existing container-based code to Hooks if you choose to do so. However, note that migrating existing code to Relay Hooks is ",Object(a.b)("strong",{parentName:"p"},Object(a.b)("em",{parentName:"strong"},"not"))," required, and ",Object(a.b)("strong",{parentName:"p"},"container-based code will continue to work"),"."),Object(a.b)("h2",{id:"accessing-relay-hooks"},"Accessing Relay Hooks"),Object(a.b)("p",null,"Make sure the latest versions of React and Relay are installed, and that you\u2019ve followed additional setup in our ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"../getting-started/installation-and-setup/"}),"Installation & Setup")," guide:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{}),"yarn add react react-dom react-relay\n")),Object(a.b)("p",null,"Then, you can import Relay Hooks from the ",Object(a.b)("strong",{parentName:"p"},Object(a.b)("inlineCode",{parentName:"strong"},"react-relay"))," module, or if you only want to include Relay Hooks in your bundle, you can import them from ",Object(a.b)("strong",{parentName:"p"},Object(a.b)("inlineCode",{parentName:"strong"},"react-relay/hooks")),":"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js"}),"import {graphql, useFragment} from 'react-relay'; // or 'react-relay/hooks'\n\n// ...\n")),Object(a.b)("h2",{id:"next-steps"},"Next Steps"),Object(a.b)("p",null,"Check out the following guides in this section:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"./suspense-compatibility/"}),"Suspense Compatibility")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"./relay-hooks-and-legacy-container-apis/"}),"Relay Hooks and Legacy Container APIs"))),Object(a.b)("p",null,"For more documentation on the APIs themselves, check out our ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"../api-reference/relay-environment-provider"}),"API Reference")," or our ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"../guided-tour/"}),"Guided Tour"),"."))}p.isMDXComponent=!0}}]);