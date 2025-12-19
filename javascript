const { default_api } = require("./index");

// Read main.tsx to check routes
await default_api.readFilesToContextTool({
  file_paths: ["src/main.tsx"],
  replace_files_in_context: false
});
