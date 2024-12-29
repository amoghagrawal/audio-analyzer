let wavesurfer;
let audioFile;
let isAnalyzing = false;

document.addEventListener('DOMContentLoaded', function () {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#0066ff',
        progressColor: '#000000',
        cursorColor: '#000000',
        height: 100,
        barWidth: 2,
        barGap: 1,
    });

    wavesurfer.on('ready', () => {
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = false;
        document.getElementById('analyzeBtn').disabled = false;
        document.getElementById('analyzePatternsBtn').disabled = false;
        document.getElementById('analyzeInstrumentsBtn').disabled = false;
    });

    wavesurfer.on('play', () => {
        document.getElementById('playBtn').textContent = 'Pause';
    });

    wavesurfer.on('pause', () => {
        document.getElementById('playBtn').textContent = 'Play';
    });
});

const uploadContainer = document.querySelector('.upload-container');
const audioInput = document.getElementById('audioFile');

uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = '#0066ff';
    uploadContainer.style.background = 'rgba(0, 102, 255, 0.1)';
});

uploadContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    resetUploadContainerStyles();
});

uploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    resetUploadContainerStyles();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        handleAudioFile(file);
    }
});

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleAudioFile(file);
    }
});

function resetUploadContainerStyles() {
    uploadContainer.style.borderColor = 'rgba(0, 102, 255, 0.3)';
    uploadContainer.style.background = 'rgba(0, 102, 255, 0.03)';
}

function handleAudioFile(file) {
    if (wavesurfer.isReady) {
        wavesurfer.destroy();
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#0066ff',
            progressColor: '#000000',
            cursorColor: '#000000',
            height: 100,
            barWidth: 2,
            barGap: 1,
        });
    }

    audioFile = file;
    wavesurfer.loadBlob(file);

    hideResults();
    wavesurfer.once('ready', () => {
        showToast('Audio file loaded successfully!');
    });
}

function hideResults() {
    document.getElementById('results').style.display = 'none';
    document.getElementById('patternResults').style.display = 'none';
    document.getElementById('instrumentResults').style.display = 'none';
}

const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', () => {
    wavesurfer.playPause();
});

async function analyze(type) {
    const loadingElement = document.querySelector('.loading');
    const resultsElement = document.getElementById(
        type === 'styles'
            ? 'results'
            : type === 'patterns'
            ? 'patternResults'
            : 'instrumentResults'
    );

    try {
        loadingElement.style.display = 'flex';
        resultsElement.innerHTML = '';
        resultsElement.style.display = 'none';

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, messages: [] }),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error);

        const content = responseData.choices[0].message.content.trim();
        const data = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

        resultsElement.style.display = 'block';
        resultsElement.innerHTML = generateHTMLForType(type, data);

        showToast(`${capitalizeFirstLetter(type)} analysis completed successfully!`);
    } catch (error) {
        console.error(`Error analyzing ${type}:`, error);
        resultsElement.style.display = 'block';
        resultsElement.innerHTML = `<p style="color: red;">Error performing ${type} analysis. Please try again.</p>`;
        showToast(`Error performing ${type} analysis.`);
    } finally {
        loadingElement.style.display = 'none';
    }
}

function generateHTMLForType(type, data) {
    if (type === 'styles') {
        return `
            <h3>Style Analysis</h3>
            <div class="pattern-item">
                <h4>Description</h4>
                <p>${data.description}</p>
            </div>
            <div class="pattern-grid">
                <div class="pattern-item">
                    <h4>Mood</h4>
                    <p><strong>Primary:</strong> ${data.mood.primary}</p>
                    <p><strong>Secondary:</strong> ${data.mood.secondary.join(', ')}</p>
                    <p><strong>Progression:</strong> ${data.mood.progression}</p>
                </div>
                <div class="pattern-item">
                    <h4>Era</h4>
                    <p><strong>Period:</strong> ${data.era.period}</p>
                    <p><strong>Influences:</strong> ${data.era.influences.join(', ')}</p>
                    <p><strong>Context:</strong> ${data.era.context}</p>
                </div>
                <div class="pattern-item">
                    <h4>Technical Details</h4>
                    <p><strong>Key Signature:</strong> ${data.technicalDetails.keySignature}</p>
                    <p><strong>Tempo:</strong> ${data.technicalDetails.tempo}</p>
                    <p><strong>Dynamics:</strong> ${data.technicalDetails.dynamics}</p>
                    <p><strong>Production:</strong> ${data.technicalDetails.production}</p>
                </div>
            </div>`;
    } else if (type === 'patterns') {
        return `
            <h3>Pattern Analysis</h3>
            <div class="pattern-item">
                <h4>Description</h4>
                <p>${data.description}</p>
            </div>
            <div class="pattern-grid">
                ${data.patterns
                    .map(
                        (pattern) => `
                        <div class="pattern-item">
                            <h4>${pattern.name}</h4>
                            <p><strong>Type:</strong> ${pattern.type}</p>
                            <p>${pattern.description}</p>
                            <p><strong>Frequency:</strong> ${pattern.frequency}</p>
                        </div>`
                    )
                    .join('')}
            </div>`;
    } else if (type === 'instruments') {
        return `
            <h3>Instrument Analysis</h3>
            <div class="pattern-item">
                <h4>Overview</h4>
                <p>${data.overview}</p>
            </div>
            <div class="pattern-grid">
                ${data.instruments
                    .map(
                        (instrument) => `
                        <div class="pattern-item">
                            <h4>${instrument.name} ${instrument.icon}</h4>
                            <p><strong>Role:</strong> ${instrument.role}</p>
                            <p>${instrument.description}</p>
                        </div>`
                    )
                    .join('')}
            </div>
            <div class="pattern-item">
                <h4>Harmonic Structure</h4>
                <div class="progression-list">
                    <h5>Progressions</h5>
                    <ul>
                        ${data.harmonicStructure.progressions
                            .map((prog) => `<li>${prog}</li>`)
                            .join('')}
                    </ul>
                </div>
                <h5>Chord Progression</h5>
                <div class="chord-grid">
                    ${data.harmonicStructure.chords
                        .map(
                            (chord) => `
                            <div class="chord-box">
                                <div class="chord-name">${chord.name}</div>
                                <div class="chord-type">${chord.type}</div>
                                <div class="chord-notes">
                                    ${chord.notes
                                        .map((note) => `
                                        <div class="chord-note">${note}</div>
                                    `)
                                        .join('')}
                                </div>
                                <div class="chord-timing">${chord.timing} - ${chord.duration}</div>
                            </div>`
                        )
                        .join('')}
                </div>
            </div>`;
    }
    return '';
}

function showToast(message) {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

document.getElementById('analyzeBtn').addEventListener('click', () => analyze('styles'));
document.getElementById('analyzePatternsBtn').addEventListener('click', () => analyze('patterns'));
document.getElementById('analyzeInstrumentsBtn').addEventListener('click', () => analyze('instruments'));