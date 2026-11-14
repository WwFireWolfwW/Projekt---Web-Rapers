import { getArtists, getClient } from './api.js';
import { currentUser } from './auth.js';
import { element, picture } from './data.js';

const status = document.querySelector('#quiz-status');
const content = document.querySelector('#quiz-content');
const counter = document.querySelector('#quiz-counter');
const progress = document.querySelector('#quiz-progress');
const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
function updateProgress(completed, label) {
    progress.value = completed;
    progress.textContent = completed + ' z 10';
    counter.textContent = label;
}
async function leaderboard() {
    const list = document.querySelector('#leaderboard');
    try {
        const { data, error } = await (await getClient()).from('quiz_scores').select('score,created_at').order('score', { ascending: false }).order('created_at').limit(10);
        if (error) throw error;
        list.replaceChildren(...data.map((row, index) => {
            const item = element('li', 'quiz-rank-row');
            const details = element('span', 'quiz-rank-details');
            details.append(element('span', '', 'Hráč'), element('small', '', new Date(row.created_at).toLocaleDateString('cs')));
            const score = element('span', 'quiz-rank-score', String(row.score));
            score.append(element('small', '', ' / 10'));
            item.append(element('span', 'quiz-rank-number', String(index + 1).padStart(2, '0')), details, score);
            return item;
        }));
        if (!data.length) list.append(element('li', 'quiz-ranking-empty', 'Zatím je tu volné místo. Zapiš první výsledek.'));
    } catch {
        list.replaceChildren(element('li', 'quiz-ranking-empty', 'Žebříček teď není dostupný. Kvíz můžeš hrát dál.'));
    }
}
try {
    const result = await getArtists();
    if (result.source !== 'supabase') throw Error();
    const artists = result.data;
    const covers = new Map();
    for (const artist of artists) for (const album of artist.albums) {
        if (!album.cover) continue;
        if (covers.has(album.cover)) covers.get(album.cover).ambiguous = true;
        else covers.set(album.cover, { artist, album, ambiguous: false });
    }
    const questions = shuffle([...covers.values()].filter(item => !item.ambiguous)).slice(0, 10);
    content.replaceChildren();
    content.setAttribute('aria-busy', 'false');
    if (questions.length < 10 || artists.length < 4) {
        status.textContent = 'Pro kvíz zatím není dost jednoznačných obalů.';
    } else {
        let index = 0, score = 0;
        function render(moveFocus = false) {
            content.replaceChildren();
            if (index === 10) { finish(); return; }
            const question = questions[index];
            updateProgress(index, String(index + 1).padStart(2, '0') + ' / 10');
            status.textContent = 'Otázka ' + (index + 1) + ' z 10. Vyber jednoho interpreta.';
            const layout = element('div', 'quiz-question');
            const artwork = element('div', 'quiz-artwork');
            const cover = element('div', 'quiz-cover');
            cover.append(picture(question.album.cover, 'Obal hádaného alba', false));
            const caption = element('div', 'quiz-artwork-caption');
            caption.append(element('span', '', 'CZ / SK diskografie'), element('span', '', 'Obal č. ' + String(index + 1).padStart(2, '0')));
            artwork.append(cover, caption);
            const answers = element('div', 'quiz-answer-area');
            const heading = element('h2', '', 'Čí je tahle deska?');
            heading.tabIndex = -1;
            const options = element('div', 'quiz-options');
            options.setAttribute('role', 'group');
            options.setAttribute('aria-label', 'Možnosti odpovědi');
            answers.append(heading, element('p', 'quiz-answer-hint', 'Pozorně se podívej na obal a vyber jméno.'), options);
            const choices = shuffle([question.artist, ...shuffle(artists.filter(item => item.slug !== question.artist.slug)).slice(0, 3)]);
            const buttons = [];
            let answered = false;
            choices.forEach((artist, choiceIndex) => {
                const button = element('button', 'quiz-option');
                button.type = 'button';
                const letter = element('span', 'quiz-option-letter', 'ABCD'[choiceIndex]);
                letter.setAttribute('aria-hidden', 'true');
                const mark = element('span', 'quiz-option-mark');
                mark.setAttribute('aria-hidden', 'true');
                button.append(letter, element('span', 'quiz-option-name', artist.name), mark);
                buttons.push(button);
                button.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;
                    const correct = artist.slug === question.artist.slug;
                    if (correct) score++;
                    buttons.forEach((item, i) => {
                        item.disabled = true;
                        if (choices[i].slug === question.artist.slug) {
                            item.classList.add('is-correct');
                            item.lastChild.textContent = '✓';
                        }
                    });
                    if (!correct) { button.classList.add('is-wrong'); mark.textContent = '×'; }
                    updateProgress(index + 1, String(index + 1).padStart(2, '0') + ' / 10');
                    status.textContent = (correct ? 'Správně! ' : 'Tentokrát ne. ') + 'Je to ' + question.artist.name + ' — ' + question.album.title + '.';
                    const next = element('button', 'button quiz-next', index === 9 ? 'Zobrazit výsledek →' : 'Další obal →');
                    next.type = 'button';
                    next.addEventListener('click', () => { index++; render(true); });
                    answers.append(next);
                    next.focus({ preventScroll: true });
                });
                options.append(button);
            });
            layout.append(artwork, answers);
            content.append(layout);
            if (moveFocus) heading.focus({ preventScroll: true });
        }
        async function finish() {
            updateProgress(10, 'HOTOVO');
            const panel = element('div', 'quiz-result');
            const total = element('div', 'quiz-result-score', String(score));
            total.append(element('span', '', ' / 10'));
            const heading = element('h2', '', score >= 8 ? 'Scénu máš v malíku.' : score >= 5 ? 'Dobrý přehled!' : 'Každý obal má svůj příběh.');
            heading.tabIndex = -1;
            const again = element('a', 'button quiz-next', 'Zkusit další desítku ↗');
            again.href = 'quiz.html';
            panel.append(element('p', 'eyebrow', 'Tvoje skóre'), total, heading, element('p', '', 'Deset obalů je za tebou. Dáš příště plný počet?'), again);
            content.append(panel);
            heading.focus({ preventScroll: true });
            status.textContent = 'Kvíz dokončen. Získal/a jsi ' + score + ' bodů z 10.';
            try {
                const user = await currentUser();
                if (user) {
                    const { error } = await (await getClient()).from('quiz_scores').insert({ user_id: user.id, score });
                    if (error) throw error;
                    status.textContent += ' Výsledek uložen do žebříčku.';
                    await leaderboard();
                } else status.textContent += ' Pro ukládání výsledků se přihlas před další hrou.';
            } catch { status.textContent += ' Výsledek se nepodařilo uložit.'; }
        }
        render();
    }
} catch {
    content.replaceChildren();
    content.setAttribute('aria-busy', 'false');
    status.textContent = 'Kvíz potřebuje připojení k databázi. Zkus stránku obnovit.';
    const retry = element('a', 'button quiz-next', 'Zkusit znovu');
    retry.href = 'quiz.html';
    content.append(retry);
}
leaderboard();
