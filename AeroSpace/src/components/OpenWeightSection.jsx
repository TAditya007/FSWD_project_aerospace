import { useState } from 'react';
import { FileText, Box, Code, Copy, Check, Sparkles, MessageSquareQuote } from 'lucide-react';

export default function OpenWeightSection() {
  const [copied, setCopied] = useState(false);

  const bibtexCode = `@misc{aerospec2026,
  title        = {AeroSpec-1: Open-Weight Aeroplane & Telemetry Pod Model},
  author       = {AeroSpace Creative Flight Lab},
  year         = {2026},
  howpublished = {OBJ mesh release},
  note         = {A high-fidelity 3D model of a paper aeroplane with RF telemetry pod. Code: coming soon.}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bibtexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="open-weight-card">
      <div className="open-weight-header">
        <div className="sub-tagline">
          <Sparkles size={14} className="icon-cyan" />
          <span>SOTA OPEN WEIGHT MODEL</span>
        </div>
        <h2 className="open-weight-title">
          AEROSPEC-1 <span className="open-weight-v">v1.0</span>
        </h2>
        <p className="body-desc">
          We present <strong>AeroSpec-1</strong>, an open-weight 3D model of a paper aeroplane and telemetry pod for rendering, flight simulation, and gloriously unnecessary aerospace research.
        </p>

        {/* Action Buttons: PDF Paper, OBJ Model, Code */}
        <div className="action-buttons-row">
          <button 
            className="sota-btn"
            onClick={() => alert('Downloading AeroSpec-1 Research Paper (Mockup PDF)...')}
          >
            <FileText size={16} />
            <span>Research Paper (PDF)</span>
          </button>
          <button 
            className="sota-btn"
            onClick={() => alert('Downloading AeroSpec-1 3D Model Mesh (.OBJ)...')}
          >
            <Box size={16} />
            <span>Model Checkpoint (.OBJ)</span>
          </button>
          <button 
            className="sota-btn disabled"
            onClick={() => alert('Code repository coming soon on GitHub!')}
          >
            <Code size={16} />
            <span>Code (Coming Soon)</span>
          </button>
        </div>
      </div>

      {/* Abstract & Peer Review */}
      <div className="open-weight-grid">
        <div className="abstract-box">
          <h4>ABSTRACT</h4>
          <p>
            AeroSpec-1 faithfully reproduces key paper plane behaviors - aerodynamic lift, table protection, perfect circular glide loops, and passive thermal moderation under everyday desktop beverage conditions. Released in clean OBJ format with baseline results on our own <em>WoodenRunwayBench</em> (a standardized evaluation suite conducted on a single desk and very possibly rigged by us). Limitations include heavy dependency on gravity, human launch, and coffee mugs.
          </p>
        </div>

        <div className="peer-review-box">
          <div className="peer-header">
            <MessageSquareQuote size={18} className="icon-cyan" />
            <h4>PEER REVIEW</h4>
          </div>
          <blockquote>
            "AeroSpec-1 is the best paper plane telemetry model out there. <strong>Trust me bro.</strong>"
          </blockquote>
          <cite>- Anonymous LocalLLaMA Reddit User</cite>
        </div>
      </div>

      {/* BibTeX Citation Box */}
      <div className="bibtex-container">
        <div className="bibtex-header">
          <span>BibTeX Citation</span>
          <button className="copy-code-btn" onClick={handleCopy}>
            {copied ? <Check size={14} className="icon-cyan" /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy BibTeX'}</span>
          </button>
        </div>
        <pre className="bibtex-code">{bibtexCode}</pre>
      </div>
    </div>
  );
}
