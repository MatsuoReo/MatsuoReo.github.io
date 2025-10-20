(function () {
    function go(el) {
        const url = el.getAttribute('data-next');
        if (url) location.href = url;
    }

    document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-next]');
        if (t) {
            e.preventDefault();
            go(t);
        }
    });


    // iOSタップ反応の安定化
    document.addEventListener('touchstart', () => { }, { passive: true });
})();
