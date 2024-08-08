import Home from '../views/Home.js';

test('Home class', async () => {
  const home = new Home();
  const html = await home.getHtml();
  expect(html).toBe(`
			<h1>Here We Go Transcendance ça commence</h1>
			<p>Welcome to the Home Page!</p>
		`);
});
