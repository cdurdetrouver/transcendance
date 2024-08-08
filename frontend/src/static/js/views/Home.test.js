import Home from './Home.js';

test('Home class', async () => {
  const home = new Home();
  const html = await home.getHtml();
  expect(html).toBe(`
			<h1>Here We Go Transcendance ça commence</h1>
			<p>Et ouais c'est une SPA in pure vanilla js.</p>
		`);
});
