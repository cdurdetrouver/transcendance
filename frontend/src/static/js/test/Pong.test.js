import Pong from '../views/Pong.js';

test('Pong class', async () => {
  const pong = new Pong();
  const html = await pong.getHtml();
  expect(html).toBe(`
			<h1>Pong</h1>
			<p>This is the pong page.</p>
		`);
});
