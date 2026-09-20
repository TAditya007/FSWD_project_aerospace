import { useState } from 'react';
import { Layers, Plane, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductMatrix() {
  const [selectedTier, setSelectedTier] = useState(0); // 0: AeroSpec, 1: AeroSpec Pro, 2: AeroSpec Pro Max
  const navigate = useNavigate();

  const products = [
    {
      id: 'aerospec',
      tag: 'NEW',
      name: 'AEROSPEC',
      headline: 'One plane. One mission. Done beautifully.',
      desc: 'The original RF paper plane. Refined until it feels inevitable. Lifts just enough, glides just right, and quietly beams telemetry like it was never there.',
      specs: [
        'Single wing lift mechanism',
        'Natural carbon-reinforced paper',
        'Stable glide on everyday updrafts'
      ],
      stack: '1 Layer Wing',
      lift: '1 Plane Thick',
      material: 'Aerospace Poly-Paper',
      connectivity: '2.4 GHz Telemetry',
      pairing: 'Not Required',
      updates: 'Never (Perfect by design)',
      bestFor: 'Daily flights and quiet desks'
    },
    {
      id: 'aerospec-pro',
      tag: 'NEW',
      name: 'AEROSPEC Pro',
      headline: 'Twice the wings. Double the telemetry.',
      desc: 'A biplane with double presence. Twice the paper, double the flight stability - without losing the plot.',
      specs: [
        'Double biplane stack lift',
        'More mass, more thermal steadiness',
        'Designed to be a desk standout'
      ],
      stack: '2 Layer Biplane',
      lift: '2 Planes Thick',
      material: 'Dual-Layer Carbon Matrix',
      connectivity: '2.4 / 5.8 GHz Dual-Band',
      pairing: 'Not Required',
      updates: 'Never',
      bestFor: 'Taller trajectories & extra stability'
    },
    {
      id: 'aerospec-promax',
      tag: 'NEW',
      name: 'AEROSPEC Pro Max',
      headline: 'Maximum stack for maximum unnecessary satisfaction.',
      desc: 'Triplane stack for maximum aerodynamic supremacy. A bold little pedestal for your flight log and a quiet flex for the entire ground control command.',
      specs: [
        'Triple triplane hypersonic stack',
        'Extra thermal & RF insulation by design',
        'Deployable on RTX 3090, on-device'
      ],
      stack: '3 Layer Triplane',
      lift: '3 Planes Thick',
      material: 'Titanium-Kevlar Foil',
      connectivity: 'Multi-Band RF & Sub-GHz',
      pairing: 'Not Required',
      updates: 'Never',
      bestFor: 'Maximum lift & supersonic presence'
    }
  ];

  return (
    <div className="product-section">
      <div className="product-header-container">
        <div className="sub-tagline">
          <Layers size={14} className="icon-cyan" />
          <span>HARDWARE SPECIFICATIONS</span>
        </div>
        <h2 className="product-main-title">
          Choose your <span className="gradient-text">AERO SPEC</span>
        </h2>
        
        {/* Tier Selector Buttons */}
        <div className="tier-tabs">
          {products.map((prod, idx) => (
            <button
              key={prod.id}
              className={`tier-tab-btn ${selectedTier === idx ? 'is-active' : ''}`}
              onClick={() => setSelectedTier(idx)}
            >
              <span>{prod.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Product Spotlight Card */}
      <div className="spotlight-card">
        <div className="spotlight-header">
          <div>
            <span className="spotlight-tag">{products[selectedTier].tag}</span>
            <h3 className="spotlight-title">{products[selectedTier].name}</h3>
            <p className="spotlight-headline">{products[selectedTier].headline}</p>
          </div>
          <button className="join-crew-btn" onClick={() => navigate('/signup')}>
            Join Mission Crew <ArrowRight size={14} />
          </button>
        </div>

        <p className="spotlight-desc">{products[selectedTier].desc}</p>

        <div className="spotlight-features">
          {products[selectedTier].specs.map((spec, i) => (
            <div key={i} className="feature-pill">
              <CheckCircle2 size={14} className="icon-cyan" />
              <span>{spec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="table-responsive">
        <table className="compare-table">
          <thead>
            <tr>
              <th>
                <div className="th-cell">
                  <span className="th-tag">SPEC</span>
                  <span className="th-title">AEROSPEC</span>
                </div>
              </th>
              <th>
                <div className="th-cell">
                  <span className="th-tag">SPEC PRO</span>
                  <span className="th-title">AEROSPEC Pro</span>
                </div>
              </th>
              <th>
                <div className="th-cell">
                  <span className="th-tag">SPEC PRO MAX</span>
                  <span className="th-title">AEROSPEC Pro Max</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="lbl">Stack:</span> {products[0].stack}</td>
              <td><span className="lbl">Stack:</span> {products[1].stack}</td>
              <td><span className="lbl">Stack:</span> {products[2].stack}</td>
            </tr>
            <tr>
              <td><span className="lbl">Lift:</span> {products[0].lift}</td>
              <td><span className="lbl">Lift:</span> {products[1].lift}</td>
              <td><span className="lbl">Lift:</span> {products[2].lift}</td>
            </tr>
            <tr>
              <td><span className="lbl">Material:</span> {products[0].material}</td>
              <td><span className="lbl">Material:</span> {products[1].material}</td>
              <td><span className="lbl">Material:</span> {products[2].material}</td>
            </tr>
            <tr>
              <td><span className="lbl">Telemetry:</span> {products[0].connectivity}</td>
              <td><span className="lbl">Telemetry:</span> {products[1].connectivity}</td>
              <td><span className="lbl">Telemetry:</span> {products[2].connectivity}</td>
            </tr>
            <tr>
              <td><span className="lbl">Pairing:</span> {products[0].pairing}</td>
              <td><span className="lbl">Pairing:</span> {products[1].pairing}</td>
              <td><span className="lbl">Pairing:</span> {products[2].pairing}</td>
            </tr>
            <tr>
              <td><span className="lbl">Firmware Updates:</span> {products[0].updates}</td>
              <td><span className="lbl">Firmware Updates:</span> {products[1].updates}</td>
              <td><span className="lbl">Firmware Updates:</span> {products[2].updates}</td>
            </tr>
            <tr>
              <td><span className="lbl">Best For:</span> {products[0].bestFor}</td>
              <td><span className="lbl">Best For:</span> {products[1].bestFor}</td>
              <td><span className="lbl">Best For:</span> {products[2].bestFor}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
