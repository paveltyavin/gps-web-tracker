define('utils/colors', ['underscore'], function(_){
  var colorName2Hex = {
    'green': '#56db40',
    'blue': '#1e98ff',
    'darkBlue': '#177bc9',
    'black': '#595959',
    'brown': '#793d0e',
    'yellow': '#ffd21e',
    'darkGreen': '#1bad03',
    'violet': '#b51eff',
    'red': '#ed4543',
    'pink': '#f371d1',
    'orange': '#ff931e',
    'olive': '#97a100',
    'night': '#0e4779',
    'lightBlue': '#82cdff',
    'darkOrange': '#e6761b',
    'gray': '#b3b3b3'
  };
  var hex2ColorName = {
  };

  for (var prop in colorName2Hex) {
    if (colorName2Hex.hasOwnProperty(prop)) {
      hex2ColorName[colorName2Hex[prop]] = prop;
    }
  }

  var colors = _.map(_.keys(hex2ColorName), function(x){return x.replace('#', '');});

  return {
    colorName2Hex: colorName2Hex,
    hex2ColorName: hex2ColorName,
    colors: colors
  }
});