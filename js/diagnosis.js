// js/diagnosis.js — 神様診断（8問版）スコアリング＆ページ連携
(function () {
    const DEITIES = [
        "ブラフマー", "サラスヴァティー", "ガネーシャ", "クリシュナ",
        "シヴァ", "パールヴァティー", "ハヌマーン", "ヴィシュヌ", "ラクシュミー",
    ];

    // 8問の採点ルール（A/B→各神様に1点）
    const RULES = [
        { A: ["ハヌマーン", "クリシュナ", "ガネーシャ"], B: ["シヴァ", "サラスヴァティー", "パールヴァティー"] }, // Q1
        { A: ["クリシュナ", "ガネーシャ", "ラクシュミー"], B: ["ヴィシュヌ", "シヴァ", "サラスヴァティー"] },   // Q2
        { A: ["ブラフマー", "ヴィシュヌ"], B: ["ガネーシャ", "ハヌマーン"] },                                         // Q3
        { A: ["シヴァ", "ブラフマー"], B: ["ヴィシュヌ", "ガネーシャ"] },                                               // Q4
        { A: ["ヴィシュヌ", "パールヴァティー"], B: ["シヴァ", "クリシュナ", "ブラフマー"] },                           // Q5
        { A: ["サラスヴァティー", "ラクシュミー", "クリシュナ"], B: ["ヴィシュヌ", "パールヴァティー"] },               // Q6
        { A: ["シヴァ", "サラスヴァティー"], B: ["ラクシュミー", "クリシュナ", "ガネーシャ"] },                         // Q7
        { A: ["ハヌマーン", "クリシュナ"], B: ["シヴァ", "サラスヴァティー", "パールヴァティー"] },                     // Q8
    ];

    // 結果ページで表示する要約（お好みで編集OK）
    const SUMMARIES = {
        "ブラフマー": { title: "創造と構想の人", desc: "構想力で道を開くタイプ。新規プロジェクトや0→1が得意。開運: 年間ロードマップを1枚に可視化。" },
        "サラスヴァティー": { title: "学びと言葉の探究者", desc: "知・言語・音の感性が強く、体系化と表現に喜び。開運: 毎日15分のイン/アウトプット習慣。" },
        "ガネーシャ": { title: "段取り名人の問題解決者", desc: "親しみやすい現実解タイプ。小さな成功を積み上げる。開運: 朝に“今日の小タスク3つ”を確定。" },
        "クリシュナ": { title: "魅力と遊び心の戦略家", desc: "楽しさで人を動かし場を回す。社交と戦術のバランス◎。開運: プロジェクトに遊び要素を1つ加える。" },
        "シヴァ": { title: "変容をもたらす求道者", desc: "削ぎ落としと集中でブレイクスルー。静けさの中で力を発揮。開運: 不要を1つ手放し、呼吸瞑想5分。" },
        "パールヴァティー": { title: "安定と献身の土台作り", desc: "人と暮らしの基盤を整える。芯の強さで支える縁の下の力持ち。開運: 身近な人への“ひと声ケア”を具体化。" },
        "ハヌマーン": { title: "勇気と実行のスペシャリスト", desc: "フットワーク最強。仲間思いで行動が早い。開運: 週1の身体チャレンジをカレンダー固定。" },
        "ヴィシュヌ": { title: "維持と調停の守り人", desc: "秩序と継続で価値を守る運用の達人。開運: 週次/月次レビューを仕組み化。" },
        "ラクシュミー": { title: "豊かさと美の引力", desc: "人を惹きつける審美眼と余裕。開運: 月1の“喜び投資”枠を用意。" }
    };

    function diagnoseFromAnswers(answersAB) {
        const score = Object.fromEntries(DEITIES.map(d => [d, 0]));
        [...answersAB].forEach((ch, i) => {
            (RULES[i][ch] || []).forEach(d => { score[d] += 1; });
        });
        const max = Math.max(...Object.values(score));
        const top = Object.entries(score).filter(([k, v]) => v === max).map(([k]) => k);
        return { answers: answersAB, score, top, max };
    }

    // ====== 診断フォーム（diagnosis_form.html） ======
    function handleFormPage() {
        const btn = document.getElementById('quizSubmitBtn');
        if (!btn) return;

        // ラジオの「並び順」でA/Bを判定（先頭がA、次がB）
        function collectAnswers() {
            const ab = [];
            for (let i = 1; i <= 8; i++) {
                const name = `q${i}`;
                const radios = Array.from(document.querySelectorAll(`input[name="${name}"]`));
                if (radios.length < 2) throw new Error(`設問${i}の選択肢が見つかりません`);
                const aVal = radios[0].value; // 先頭 = A
                const checked = radios.find(r => r.checked);
                if (!checked) { throw new Error(`設問${i}が未回答です`); }
                ab.push(checked.value === aVal ? 'A' : 'B');
            }
            return ab.join("");
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                const answersAB = collectAnswers();
                const result = diagnoseFromAnswers(answersAB);
                sessionStorage.setItem('diagnosisResult', JSON.stringify(result));
                // data-next 属性があればそれを優先
                const host = btn.closest('[data-next]');
                const url = host ? host.getAttribute('data-next') : 'diagnosis_result.html';
                location.href = url;
            } catch (err) {
                alert(err.message || String(err));
            }
        });
    }

    // ====== 結果ページ（diagnosis_result.html） ======
    function handleResultPage() {
        const heroName = document.getElementById('result-name');
        if (!heroName) return;

        const raw = sessionStorage.getItem('diagnosisResult');
        if (!raw) {
            heroName.textContent = "未診断";
            return;
        }
        const data = JSON.parse(raw);
        const name = data.top.join(" ＆ "); // 同点時はミックス表示
        heroName.textContent = name;

        const titleEl = document.querySelector('.resultBody__title');
        const descEl = document.querySelector('.resultBody__desc');
        if (titleEl && descEl) {
            const first = data.top[0];
            const info = SUMMARIES[first] || { title: "診断結果", desc: "" };
            titleEl.textContent = info.title;

            // 説明を差し替え
            descEl.innerHTML = "";
            const p = document.createElement('p');
            p.textContent = info.desc;
            descEl.appendChild(p);

            // メタ情報（あなたの回答＆最高点）
            const p2 = document.createElement('p');
            p2.className = "resultBody__meta";
            p2.textContent = `あなたの回答: ${data.answers} ／ 最高点: ${data.max}`;
            descEl.appendChild(p2);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleFormPage();
        handleResultPage();
    });
})();

