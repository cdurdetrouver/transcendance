import About from './About.js';

test('About class', async () => {
  const about = new About();
  const html = await about.getHtml();
  expect(html).toBe(`
			<h1>About</h1>
			<p>This is the about page.</p>
		`);
});
