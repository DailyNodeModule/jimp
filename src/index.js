const path = require('path');
const jimp = require('jimp');
const cheerio = require('cheerio');
const request = require('request-promise-native');
const fs = require('fs-extra');

const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');

(async () => {
    await fs.ensureDir(outputDir);

    const $ = await request({
        url: 'https://its-a-cat-world.tumblr.com/',
        transform: cheerio.load
    });

    const posts = $('article.photo').get().map((photo) => ({ 
        description: $('figcaption', photo).text().trim(),
        url: $('.photo-wrapper-inner img', photo).attr('src'),
        id: $('[data-post-id]', photo).attr('data-post-id')
    }));

    for (const post of posts) {
        const { url, description, id } = post;

        const image = await request({ url, encoding: null });
        const font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);

        // Data can be read from a file or as a buffer.
        // Each method can take a callback as the last argument or return a Promise.
        const output = await 
            (await jimp.read(image))
                // The methods are chainable 
                .resize(640, jimp.AUTO) // When resizing jimp can automatically figure out the corresponding dimension.
                // There are plenty of built-in manipulation functions such as printing text over an image.
                .print(font, 10, 10, description)
                // Jimp can return a buffer, or base64 to create data-uri in the browser.
                .getBufferAsync(jimp.MIME_JPEG);

        fs.writeFile(path.join(outputDir, id+'.jpg'), output);
    }
})();