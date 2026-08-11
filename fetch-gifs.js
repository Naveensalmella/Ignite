const fs = require('fs');

async function fetchAll() {
    const all = [];
    for (let offset = 0; offset < 1500; offset += 100) {
        console.log('Fetching...', offset);
        try {
            const r = await fetch('https://oss.exercisedb.dev/api/v1/exercises?offset=' + offset + '&limit=100');
            const text = await r.text();
            if (text.startsWith('<')) { console.log('Rate limited at', offset, '- saving what we have'); break; }
            const data = JSON.parse(text);
            const exercises = data.data || [];
            if (exercises.length === 0) break;
            exercises.forEach(function (e) {
                if (e.gifUrl) all.push({ name: e.name.toLowerCase(), gif: e.gifUrl });
            });
        } catch (err) { console.log('Stopped at', offset, '- saving what we have'); break; }
    }
    fs.writeFileSync('src/data/exerciseGifs.json', JSON.stringify(all));
    console.log('Done!', all.length, 'exercises saved');
}

fetchAll();