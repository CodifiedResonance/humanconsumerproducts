/*
  HUMAN CONSUMER PRODUCTS — registry of minds and concepts.
  The only file that changes when a mind is admitted or a concept is added.
  After editing, run: python3 build.py   (regenerates concepts.json and llms.txt for agents)

  Each admitted mind gets: a page, their concepts, a brief and commission page per concept,
  and their own Back the mind page using THEIR payment link.
*/
window.HCP = {
  entity: {
    name: 'Human Consumer Products',
    domain: 'humanconsumerproducts.com',
    principal: 'Andrew Thomas',
    contact: 'drewthomasenterprises@gmail.com',
    admissionForm: 'https://formspree.io/f/mjyyqvqw',
    commissionForm: 'https://formspree.io/f/mdeerkoe'
  },
  minds: [
    {
      slug: 'andrew-thomas',
      admitted: true,
      name: 'Andrew Thomas',
      place: 'Leeds, UK',
      line: 'Originates consumer concepts for a world with abundant intelligence.',
      statement: 'Backing the mind is standing support for Andrew Thomas to keep originating concepts — not one product, but the next one, and the one after that.',
      contact: 'drewthomasenterprises@gmail.com',
      backMonthly: 'https://buy.stripe.com/fZueVe9WK9nJgBY9bk8ww04', // Stripe Payment Link (recurring)
      backOnce: 'https://buy.stripe.com/fZu7sM6KybvRetQdrA8ww03',    // Stripe Payment Link (one-off, customer chooses amount)
      concepts: [
        {
          id: 'caster',
          code: 'HCP-001',
          title: 'The caster',
          status: 'Live demo',
          stage: 'Concept',
          rights: 'Held by originator',
          demo: 'caster',
          headline: 'You cast.',
          summary: 'A creation device. Say what you want to exist and it forms in light above the table, for everyone at it. Shape it by hand, keep it, or send it to a screen.',
          versions: [
            ['v0.1', '2026-11-07', 'First form: the Codex Drive. Puck, light-field aperture, five moves.'],
            ['v0.2', '2026-11-07', 'Named. The device is a caster; what it makes are casts.']
          ],
          feasibility: [
            ['Now', 'Speak it', 'Voice to frontier models to generated 3D form. Works today; speed and polish are closing fast.'],
            ['Now', 'Shape it', 'Camera-based hand tracking reads pinch, pull and turn well enough to sculpt with.'],
            ['Partly', 'Feel it', 'Ultrasound arrays press sensation onto bare fingertips in mid-air. Commercial, but subtle.'],
            ['Partly', 'Cast light', 'Glasses-free holographic displays a whole table can see ship today; the image stays close to the glass.'],
            ['Not yet', 'Float it free', 'An image in open air you can walk around and reach into is lab-stage.'],
            ['Now', 'Gather and send', 'Many viewers at once, streaming to a TV, sending to another caster: standard today.']
          ],
          brief: [
            ['The concept', 'A stone, brass and sapphire puck about 110 mm across. You say what you want to exist and it forms in light above the caster, visible to everyone at the table. You shape it with your hands, feel its edges through ultrasound, keep it, or send it to a TV or another caster. The device is a caster; what it makes are casts.'],
            ['Why now', 'Intelligence is abundant, but what we make with it still passes through a laptop lid or a phone pane. Phones are windows you look into alone. The caster is a fire people gather around: a computer built for making things together, at the height of a table.'],
            ['The field', ['Hologram companions (Razer AVA, Everthine A1) are faces to talk to, not tools to make with.', 'OpenAI’s first device is reported to be puck-sized, with no screen.', 'Glasses-free holographic displays exist; none combine intelligence and hands.', 'Open position: make with it, in light, together.']],
            ['First build', ['Light-field glass aperture; the image rises out of the caster.', 'Hand tracking and an ultrasound haptic ring.', 'Far-field voice, on-device model, frontier models for generation.', 'Streams to TV and glasses. A brass ring cuts cameras and microphones in hardware.']],
            ['The ask', 'Co-commission a working rig and a looks-like prototype, built by a hardware studio against this brief. Commissioners receive first look, a seat in build reviews, and first right to license.']
          ]
        }
      ]
    }

    /* TEMPLATE — copy, fill, set admitted: true
    ,{
      slug: 'first-last', admitted: false, name: 'First Last', place: 'City, Country',
      line: 'One line on what they originate.', statement: 'Why backing this mind matters.',
      contact: 'their@email.com', backMonthly: 'https://buy.stripe.com/...', backOnce: 'https://buy.stripe.com/...',
      concepts: [
        { id: 'concept-name', code: 'HCP-002', title: 'Concept title', status: 'Live demo',
          stage: 'Concept', rights: 'Held by originator', headline: 'Short line.', summary: 'What it is.',
          versions: [['v0.1', 'YYYY-MM-DD', 'First form.']], feasibility: [],
          brief: [['The concept','...'], ['Why now','...'], ['The ask','...']] }
      ]
    }
    */
  ]
};
