import Test from "./Test.js";

test("Test class", async () => {
	  const test = new Test();
  const html = await test.getHtml();
  expect(html).toBe(`
			<h1>TEST</h1>
			<p>test page easy.</p>
		`);
});
