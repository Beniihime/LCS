// const purgecss = require('@fullhuman/postcss-purgecss');

// module.exports = {
//   plugins: [
//     require('autoprefixer'),
//     ...(process.env.NODE_ENV === 'production'
//       ? [
//           purgecss({
//             content: ['./index.html', './src/**/*.vue', './src/**/*.js'],
//             css: ['./src/style.css'],
//             safelist: {
//               standard: [/^p-/, 'logoLCS', 'lcs'],
//             },
//             defaultExtractor(content) {
//               return content.match(/[\w-/:]+(?<!:)/g) || [];
//             },
//           }),
//         ]
//       : []),
//   ],
// };
