const html = `\"trailingPE\":{\"raw\":23.832636,\"fmt\":\"23.83\"}`;
const peMatch = html.match(/(?:"|\\")trailingPE(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
console.log("PE Match:", peMatch ? peMatch[1] : "Not found");

const html2 = `"trailingPE":{"raw":23.832636,"fmt":"23.83"}`;
const peMatch2 = html2.match(/(?:"|\\")trailingPE(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
console.log("PE Match 2:", peMatch2 ? peMatch2[1] : "Not found");
