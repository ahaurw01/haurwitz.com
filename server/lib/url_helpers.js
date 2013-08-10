function _removeUnsafeCharacters(string) {
  return string.replace(/[^a-z0-9\s]/ig, '');
}


function _replaceSpacesWithDahes(string) {
  return string.replace(/\s/g, '-');
}

function makeSafeUrlString(string) {
  var safeString = _removeUnsafeCharacters(string);
  safeString = _replaceSpacesWithDahes(safeString);
  return safeString.toLowerCase();
}

exports.makeSafeUrlString = makeSafeUrlString;