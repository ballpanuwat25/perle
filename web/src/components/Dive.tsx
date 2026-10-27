// Below the surface: the stage sticks while the five oils are walked through. The leads and tags
// are filled in by the dive (lib/under-oil.js).
export function Dive() {
  return (
    <section className="dive" id="dive" aria-label="The five oils in a drop">
      <div className="dive-stage">
        <canvas aria-hidden="true" />
        <svg className="leads" aria-hidden="true" />
        <div className="tags" />
        <div className="dive-end">
          <h2>Five oils.<br />That’s the whole drop.</h2>
          <p>Each bead is sized by its share of the formula. Shares are illustrative.</p>
          <a className="cta" href="#buy">Where to buy</a>
        </div>
      </div>
    </section>
  );
}
