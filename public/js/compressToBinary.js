import fs from 'fs';

const compressToBinary = (inputPath, outputPath) => {
    fs.readFile(inputPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        const jsonData = JSON.parse(data);
        const rows = jsonData.length;
        const cols = jsonData[0].length;
        const buffer = Buffer.alloc(4 + 4 + rows * cols * 4);

        buffer.writeUInt32LE(rows, 0);
        buffer.writeUInt32LE(cols, 4);

        let offset = 8;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                buffer.writeFloatLE(jsonData[i][j], offset);
                offset += 4;
            }
        }

        fs.writeFile(outputPath, buffer, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log(`File successfully compressed to binary: ${outputPath}`);
            }
        });
    });
};

compressToBinary('public/data/height_cache_WASS316L.json', 'public/data/height_cache_WASS316L.bin');
compressToBinary('public/data/height_cache_H282.json', 'public/data/height_cache_H282.bin');
