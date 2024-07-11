const fs = require('fs');
const path = require('path');

const directories = [
    'src/strategies',
    'src/models',
    'src/routes',
    'src/services'
];

const files = [
    'src/strategies/OAuthStrategy.ts',
    'src/strategies/OutlookOAuthStrategy.ts',
    'src/models/User.ts',
    'src/routes/auth.ts',
    'src/services/UserService.ts',
    'src/elasticSearchClient.ts',
    'src/app.ts'
];

// Function to create directories recursively
function createDirectories() {
    directories.forEach(directory => {
        const dirPath = path.join(__dirname, directory);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        } else {
            console.log(`Directory already exists: ${dirPath}`);
        }
    });
}

// Function to create files
function createFiles() {
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '', 'utf8');
            console.log(`Created file: ${filePath}`);
        } else {
            console.log(`File already exists: ${filePath}`);
        }
    });
}

// Run the functions to create directories and files
createDirectories();
createFiles();
