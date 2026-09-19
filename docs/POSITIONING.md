# Declarative Forms

## Product, Positioning & Strategic Brief

**Document role:** Foundational reference
**Audience:** Product managers, designers, copywriters, researchers, engineers, consultants, freelancers, partners, and other collaborators
**Scope:** Durable product vision, positioning, audience, messaging principles, and strategic guardrails
**Not intended to be:** A feature specification, roadmap, landing-page brief, technical reference, or current-state inventory

---

# 1. Purpose of this document

This document exists to give anyone working on Declarative Forms a common understanding of:

* what the product fundamentally is;
* why it should exist;
* who it is for;
* what problem it is trying to own;
* how it differs from other approaches to forms;
* how open source, self-hosting, Git, YAML, and AI fit into the product story;
* what should remain true as the implementation evolves;
* how the product should and should not be communicated.

It should be possible for a new product manager, freelance designer, copywriter, market researcher, engineer, or consultant to read this document and form a sufficiently accurate mental model of the product before beginning their work.

This is intentionally more durable than a product requirements document or website brief. Individual features, interfaces, supported field types, workflows, integrations, infrastructure choices, and commercial models may change. The underlying thesis should change much less frequently.

When this document conflicts with a technical specification about how the product currently works, the technical specification should be treated as authoritative about implementation. This document should be treated as authoritative about strategic intent.

---

# 2. Executive summary

**Declarative Forms is an open-source platform for defining forms as structured files and turning those definitions into working forms.**

Instead of constructing a form inside a proprietary visual editor, the author describes what the form should be in a human-readable declarative format. That definition can live alongside the rest of a team's work, be versioned, reviewed, generated, copied, modified, and reasoned about using ordinary software tooling and AI.

Declarative Forms provides the runtime around that definition: turning it into an experience respondents can use and handling the operational work required for forms to function.

The important idea is not YAML itself.

The important idea is that **a form can be an owned, portable, inspectable definition rather than an object trapped inside a product interface**.

Git and YAML make that idea concrete today. Open source and self-hosting extend it from control of the definition to control of the infrastructure. AI makes the authoring model accessible to a much larger group of people than traditional “as-code” products historically served.

Declarative Forms therefore sits at the intersection of three shifts:

1. more work is becoming declarative and automation-friendly;
2. people outside traditional software engineering increasingly work with APIs, automation, structured data, configuration, and technical tools;
3. AI agents make structured text interfaces dramatically more accessible because users no longer need to manually know every syntax rule before they can create something useful.

The product should embrace those shifts without becoming “an AI form builder.”

**AI is an important interface to Declarative Forms. It is not the reason Declarative Forms exists.**

---

# 3. The product thesis

Forms are deceptively simple.

Creating five questions on a page is easy. Maintaining a form as part of a real workflow is not.

As soon as a form matters, teams encounter questions about versioning, validation, branching logic, data handling, review, deployment, integrations, ownership, reuse, changes over time, and what happens when the original tool is no longer appropriate.

Traditional form builders solve this by making the form an object inside their application.

Custom development solves it by making the form part of an application.

Declarative Forms proposes a third model:

> **The form itself is a definition. The platform turns that definition into a working service.**

The author owns the description of the form. Declarative Forms supplies the machinery required to execute it.

That separation is the foundation of the product.

It means authors can think primarily about the intent and structure of the form rather than about UI components, state management, validation implementation, persistence, submission infrastructure, or delivery plumbing.

At the same time, the definition remains explicit enough to inspect, edit, review, generate, transform, and version.

This is the central trade:

**More explicit than a visual builder. Far less infrastructure than building a form application yourself.**

---

# 4. The worldview behind the product

## 4.1 Software is becoming more declarative

Across software and operational tooling, people increasingly describe desired outcomes through configuration rather than constructing every underlying mechanism themselves.

The user expresses *what* should exist. A system determines *how* to execute it.

Forms are particularly well suited to this model because their essential structure is inherently declarative:

* ask this question;
* require this answer;
* show this field under this condition;
* move here next;
* display this message when complete;
* send the resulting information somewhere.

A form definition can express those intentions without requiring the author to implement the rendering and submission system.

## 4.2 “Technical” is becoming a spectrum rather than a profession

The historical division between “technical users” and “nontechnical users” is becoming less useful.

Product managers query databases. Marketers configure automation. Revenue operations teams work with APIs. Researchers manipulate structured datasets. Sales operations teams build workflows. Startup generalists edit websites. Consultants configure integrations. Designers work directly in implementation tools.

Many of these people do not identify as developers and should not need to.

But they are increasingly comfortable with structured systems.

Declarative Forms should be designed for this broader population.

The relevant question is therefore not:

> “Is this person a software engineer?”

It is:

> **“Is this person comfortable working with structured tools—or able to become comfortable with them when software and AI provide sufficient assistance?”**

That is a considerably larger and more durable audience.

## 4.3 AI changes the accessibility of “as-code” products

Historically, a text-based configuration interface created a substantial adoption barrier.

A person needed to understand syntax before they could benefit from the system.

AI changes that relationship.

A user can increasingly describe an outcome in natural language and have an agent produce or modify the underlying structured representation. The human can inspect the result, test it, request changes, and retain a readable artifact.

That makes declarative systems unusually compatible with AI.

A proprietary visual builder exposes controls designed primarily for humans to click.

A structured definition exposes an interface that both humans and machines can read and manipulate.

This makes Declarative Forms naturally suited to a world where work is increasingly performed collaboratively between people and software agents.

The strategic implication is significant:

**The structured definition is not merely an implementation choice. It is an interface for both humans and machines.**

---

# 5. Category

## Primary category: Forms as Code

“Forms as Code” is the clearest description of the architectural idea.

It establishes an immediate contrast with forms that exist primarily inside a visual builder.

It also connects Declarative Forms with familiar ideas such as infrastructure as code, configuration as code, and content as code.

However, the category should not become a barrier.

“Forms as Code” does **not** mean:

* only programmers can use the product;
* users must write application code;
* every user must understand Git deeply;
* forms need to be compiled into an application;
* the product is merely a developer library.

The category describes the **operating model**, not the required identity of the user.

For broader audiences, supporting descriptions may be more approachable:

**Forms defined as files.**
**Forms maintained in Git.**
**Declarative forms.**
**Version-controlled forms.**
**Forms you can create and maintain with your tools and AI agents.**

These descriptions should complement rather than replace the category.

---

# 6. Canonical product definition

The most durable definition is:

> **Declarative Forms turns a structured form definition into a working form while keeping the definition under the author's control.**

A slightly fuller version:

> **Declarative Forms is an open-source Forms-as-Code platform. Define a form in a human-readable file, keep it in your repository, and Declarative Forms provides the runtime that turns it into a live form and handles the surrounding submission workflow.**

For a less technical audience:

> **Declarative Forms lets you describe a form in a simple structured file instead of building it in a proprietary editor. The file remains yours; Declarative Forms turns it into the working form.**

For technically sophisticated audiences:

> **Declarative Forms separates form definition from form runtime. Definitions are declarative, versionable artifacts; the platform handles rendering, validation, submission infrastructure, and configured downstream delivery.**

These are different explanations of the same product, not different positions.

---

# 7. What the product is really selling

Declarative Forms does not fundamentally sell YAML.

It does not fundamentally sell Git integration.

It does not fundamentally sell form rendering.

Those are mechanisms.

The product sells a different relationship with forms.

### 7.1 Ownership

The definition exists as an artifact the user controls rather than only as state inside another application's database.

### 7.2 Inspectability

A form can be read directly.

Its structure does not need to be reconstructed by clicking through a sequence of settings screens.

### 7.3 Maintainability

Changes can be understood as changes to an artifact rather than edits hidden inside a dashboard.

### 7.4 Reproducibility

Definitions can be copied, templated, generated, transformed, and reused.

### 7.5 Collaboration

Forms can participate in existing review and change-management workflows rather than introducing an entirely separate authoring system.

### 7.6 Automation

A structured definition can be created and modified programmatically by scripts, tooling, and AI agents.

### 7.7 Reduced infrastructure burden

Authors get many of the properties of treating a form as software without having to build and maintain an entire form application.

### 7.8 Control

Open-source and self-hosted deployment provide a path for teams that need more control over infrastructure, data, customization, or operating environment.

Together, these produce the core benefit:

> **Forms become manageable assets rather than isolated objects in a form builder.**

---

# 8. Audience

The audience should be defined first by **working behavior**, then by job title.

## 8.1 Core audience: technical builders and operators

The central audience consists of people who create and maintain operational workflows and are comfortable with structured tools.

They may write code, but they do not have to.

Common traits include:

* they use automation or integration tools;
* they understand the idea of structured data;
* they are comfortable editing configuration;
* they work in or around repositories;
* they interact with APIs or webhooks;
* they use AI to generate technical artifacts;
* they value repeatable systems over one-off manual processes;
* they care about seeing how something is configured;
* they dislike important operational logic being hidden inside opaque interfaces.

This behavioral definition should be more important than any individual persona.

## 8.2 Audience groups

### Software and product builders

Engineers, technical founders, developer advocates, platform teams, solutions engineers, and technically inclined product managers.

These users immediately understand the advantages of version-controlled definitions and are likely to be the easiest initial adopters.

### Technical operators

Marketing operations, revenue operations, sales operations, growth teams, customer operations, implementation teams, automation specialists, and similar roles.

Their work increasingly consists of connecting systems, manipulating structured information, defining workflows, and maintaining operational infrastructure.

They may not want to build software, but they often appreciate systems that are explicit, repeatable, and automatable.

### AI-assisted builders

Product managers, researchers, consultants, founders, designers, operations generalists, and other people who may not manually author configuration but can direct an AI agent to do so.

For these users, Declarative Forms can provide the control benefits of a structured system without requiring them to become YAML experts.

### Infrastructure-conscious organizations

Teams for whom open source, self-hosting, infrastructure ownership, source availability, or deployment control materially affects adoption.

These concerns may be driven by architecture, security policy, procurement, integration requirements, customization needs, or a philosophical preference for open systems.

---

# 9. Who is not necessarily the target

Declarative Forms should not attempt to become the default form tool for every person who needs a form.

That would erase the distinction that makes it useful.

A person whose primary requirements are:

* a highly visual drag-and-drop creation experience;
* extensive visual layout control without touching structured configuration;
* sophisticated survey methodology and statistical research tooling;
* a complete marketing campaign platform;
* a broad no-code application/database environment;

may be better served by another category of product.

That is not a product failure.

Strong positioning requires a meaningful tradeoff.

Declarative Forms becomes compelling when the form needs to behave more like a maintained system than a disposable document.

---

# 10. The problem

The surface-level problem is:

> “I need a form.”

That is too broad to position against.

The deeper problem is:

> **“I need a form to be part of a system or workflow, but my current choices force me either to surrender control to a visual SaaS tool or to build too much infrastructure myself.”**

Traditional builders introduce a separate environment in which the form must be manually created and maintained.

Custom forms provide control but introduce frontend and backend implementation work.

Schema/rendering libraries can remove some frontend effort while leaving hosting, submissions, persistence, integrations, and operational concerns to the team.

Declarative Forms occupies the space between those approaches.

The author explicitly defines the form.

The platform operates it.

---

# 11. Jobs to be done

The product should be understood through jobs rather than feature lists.

## Functional job

**When I need a form as part of a real workflow, help me define and publish it without building a dedicated form application or maintaining it inside an isolated proprietary editor.**

## Change-management job

**When a form changes, help me understand, review, reproduce, and manage that change using workflows my team already trusts.**

## Automation job

**When forms need to be created or updated repeatedly, help me treat their definitions as structured artifacts that software and AI can work with.**

## Ownership job

**When a form becomes important to my organization, give me confidence that its definition and operating model are not trapped in an opaque tool.**

## Infrastructure job

**When I need more control over how the system runs, give me a credible path from hosted convenience to operating the open-source stack myself.**

---

# 12. Desired outcomes

Users should feel that Declarative Forms helps them achieve the following outcomes:

### “I can understand exactly what this form is.”

The definition is explicit and inspectable.

### “I can change it safely.”

The artifact can participate in version control, review, and testing workflows.

### “I don't need to build the boring infrastructure.”

The platform turns the definition into something respondents can actually use.

### “I can automate this.”

Forms do not have to be handcrafted one by one through a graphical interface.

### “My AI tools can work with this.”

Agents can reason over a structured, documented representation rather than attempting to operate a proprietary UI.

### “I retain meaningful control.”

The definition is owned by the user, and open-source/self-hosted options provide additional control when required.

### “This can grow with the workflow.”

The authoring model should remain understandable as the form becomes more sophisticated.

---

# 13. Positioning statement

> **For technical builders and operators who need forms to participate in real workflows, Declarative Forms is an open-source Forms-as-Code platform that turns version-controlled form definitions into working forms. Unlike visual form builders or custom implementations, it keeps the form definition explicit and under your control while providing the runtime needed to operate it.**

This is an internal positioning statement.

It is not intended to be copied word-for-word into every piece of external marketing.

---

# 14. Positioning shorthand

The following ideas should remain close to the center of the brand:

**The form is a file.**

**The definition is yours.**

**Describe the form; don't build the form system.**

**Treat important forms like maintained assets.**

**Human-readable. Machine-readable.**

**Built for people and agents to work on together.**

**Hosted when convenient. Self-hosted when control matters.**

These are messaging territories, not mandatory taglines.

---

# 15. Value pillars

## Pillar 1 — Explicit by design

Important logic should be visible.

A declarative definition provides a compact representation of what the form is supposed to do.

Users should be able to reason about their form without navigating an invisible state scattered across many configuration screens.

**Emotional benefit:** confidence and clarity.

---

## Pillar 2 — Fits existing workflows

Forms should not require an entirely separate change-management process.

A form definition can live alongside related work and participate in familiar workflows for editing, reviewing, tracking, and reverting changes.

Git is especially valuable here, but the strategic value is broader:

**the form participates in the team's system of work rather than existing outside it.**

**Emotional benefit:** continuity and control.

---

## Pillar 3 — Runtime without reinvention

Treating a form as a structured artifact should not mean teams need to rebuild rendering, validation, submission handling, and every other operational concern.

Declarative Forms handles the execution layer.

This is an essential part of the value proposition. Without it, the product would merely be a schema or rendering library.

**Emotional benefit:** leverage.

---

## Pillar 4 — Designed for automation

A form stored as structured text is inherently composable.

It can be generated from templates, transformed, copied across projects, updated systematically, validated by tooling, and manipulated by AI agents.

Automation is therefore not a bolt-on benefit.

It follows naturally from the architecture.

**Emotional benefit:** scale and efficiency.

---

## Pillar 5 — Open and controllable

Open source and self-hosting make the product credible to users who care about how their infrastructure works and where operational responsibility sits.

This should not be expressed merely as ideological opposition to SaaS.

The more useful principle is:

> **Convenience should not require unnecessary surrender of control.**

The hosted product can offer the easiest route to adoption.

The open-source stack provides a different operating choice when users need it.

**Emotional benefit:** trust and independence.

---

# 16. The role of Git

Git is currently central to the product and provides several important properties:

* a durable source of truth;
* change history;
* review workflows;
* branching;
* reproducibility;
* collaboration;
* compatibility with developer and AI tooling.

However, messaging should avoid confusing mechanism with value.

Users do not ultimately want “Git integration.”

They want things like:

* knowing what changed;
* reviewing changes;
* recovering previous versions;
* keeping related artifacts together;
* making changes through existing workflows;
* letting automation operate on the form.

Git is an excellent mechanism for producing those outcomes.

This distinction matters because it keeps the positioning useful even as interfaces and workflows evolve.

---

# 17. The role of YAML

YAML is a practical representation of the form definition.

It is:

* human-readable;
* machine-readable;
* compact;
* widely understood by developer tooling;
* relatively approachable for AI generation;
* suitable for version control.

But YAML is not the product's value proposition.

Avoid messaging such as:

> “The easiest way to write YAML forms.”

That unnecessarily narrows the category.

The better framing is:

> **The form has an explicit, structured definition. YAML is how that definition is expressed today.**

The distinction is strategically important.

---

# 18. The role of AI

AI deserves a prominent place in the product strategy, but a carefully bounded one.

## AI lowers the authoring barrier

A user should increasingly be able to say:

> “Create an application form with these questions. Ask this follow-up when the applicant chooses enterprise. Require a work email. Send successful applications into this workflow.”

The agent can translate that intent into the structured definition.

This changes who can successfully use an as-code product.

## AI increases the value of structure

Agents work especially well when given explicit schemas, documented constraints, and inspectable text artifacts.

Declarative Forms provides exactly that kind of environment.

A human and an agent can work on the same source artifact.

## AI should not become a prerequisite

The product should remain coherent without AI.

A user should still be able to author, inspect, understand, validate, and maintain a definition directly.

That protects the product from dependence on a particular model, agent, interface, or AI trend.

## Strategic formulation

> **Declarative Forms is AI-native because its underlying representation is naturally usable by agents—not because an AI chat box has been added to a form builder.**

This difference should guide future product decisions.

---

# 19. Alternatives and competitive frame

Declarative Forms competes less with individual companies than with several ways of solving the same problem.

## Visual form builders

**Strength:** extremely accessible manual creation.

**Tradeoff:** the form usually exists primarily inside the vendor's interface and operating model.

Declarative Forms should not attempt to beat these products at being visual builders.

The distinction is explicit, file-based ownership and maintainability.

---

## Custom frontend and backend

**Strength:** maximum implementation control.

**Tradeoff:** the organization must build and maintain the rendering, validation, storage, upload, delivery, and operational infrastructure it needs.

Declarative Forms should provide much of the control benefit with substantially less custom infrastructure.

---

## Schema-driven form libraries

**Strength:** declarative rendering inside an application.

**Tradeoff:** teams commonly still need to assemble the surrounding runtime and submission architecture.

Declarative Forms should be understood as a working form system, not simply a renderer.

---

## Form backend / endpoint products

**Strength:** remove submission backend work from custom HTML forms.

**Tradeoff:** teams still build and maintain the form experience itself.

Declarative Forms starts one level higher: the definition describes the form experience as well.

---

## Survey and research platforms

**Strength:** specialized research authoring, distribution, analytics, panels, or methodologies.

**Tradeoff:** they solve a broader and different research problem.

Declarative Forms should not position itself as a replacement for specialist research infrastructure unless product strategy explicitly moves in that direction.

---

## Workflow/no-code platforms

**Strength:** broad automation and application-building capabilities.

**Tradeoff:** forms are usually one component inside a much larger proprietary environment.

Declarative Forms is narrower and more opinionated.

That focus is a strength.

---

# 20. Differentiation

The defensible idea is not any individual field type or feature.

Features can be copied.

The differentiation comes from the combination of:

1. an explicit declarative form definition;
2. source-controlled ownership of that definition;
3. a complete enough runtime that users do not need to build the form system themselves;
4. automation- and AI-friendly authoring;
5. open-source availability;
6. a self-hosting path.

Each element reinforces the others.

A schema without a runtime is infrastructure for developers.

A runtime without an owned definition becomes another form builder.

A structured definition without good tooling becomes cumbersome.

AI without an explicit underlying representation becomes opaque.

Self-hosting without a usable product creates operational burden without benefit.

**The proposition comes from the system, not one isolated feature.**

---

# 21. Product principles

These principles should influence product decisions even when the specific implementation changes.

## 21.1 The definition should remain understandable

A person should be able to inspect the source representation and develop a useful understanding of the form.

Avoid unnecessary magic.

## 21.2 Declarative before imperative

Whenever possible, users should describe desired behavior rather than implement that behavior themselves.

The platform should carry the execution burden.

## 21.3 Humans and agents are both first-class authors

Documentation, schemas, errors, interfaces, and workflows should work well for people and machine agents.

Neither should require a completely separate product model.

## 21.4 Progressive complexity

Simple forms should remain simple to define.

Sophisticated behavior should be available without forcing every user to understand it upfront.

## 21.5 Ownership should be real, not rhetorical

Users should be able to inspect and retain the artifact that defines their forms.

Avoid claims of ownership that depend entirely on access to the platform itself.

## 21.6 Hosted convenience and infrastructure control can coexist

The hosted service and self-hosted deployment should be understood as two ways of operating the same underlying idea rather than opposing products.

## 21.7 Integrate rather than replace

Declarative Forms should fit into workflows.

It does not need to become the CRM, marketing platform, database, analytics suite, automation platform, or application framework surrounding the form.

## 21.8 Prefer explicit composition over product sprawl

When another system already solves a problem well, connecting to it may be more valuable than recreating it inside Declarative Forms.

## 21.9 The respondent experience matters

The architecture may be novel, but respondents should not need to understand it.

To the person completing the form, it should simply feel like a good form.

## 21.10 Technical credibility matters

The audience includes people capable of inspecting claims and implementation.

Transparent tradeoffs strengthen the product more than exaggerated promises.

---

# 22. Strategic non-goals

Unless product strategy deliberately changes, Declarative Forms should not drift toward becoming:

* a generic no-code application builder;
* a sprawling workflow automation suite;
* an enterprise survey analytics platform;
* a proprietary form database with a YAML import feature;
* a visual builder whose structured representation is incidental;
* a UI component library requiring teams to assemble the entire runtime themselves;
* an “AI wrapper” whose primary value disappears without a language model.

These boundaries help preserve coherence.

---

# 23. Messaging hierarchy

Communication should normally move through the following sequence.

## 1. Outcome

Start with what becomes possible.

Examples of ideas:

* create and maintain working forms without building the form infrastructure;
* keep important forms as explicit artifacts;
* make forms part of the same workflows as the systems around them.

## 2. Mechanism

Then explain why the product is different.

The form is described in a structured definition rather than being created only inside a visual dashboard.

## 3. Workflow

Make the model concrete.

Define it, maintain it in your repository, and let Declarative Forms turn it into the working experience.

## 4. Benefits

Translate architecture into consequences:

* reviewable;
* reproducible;
* automatable;
* AI-friendly;
* maintainable;
* controllable.

## 5. Proof

Use the open-source implementation, schema, working forms, repository workflow, and self-hosted option as evidence.

Do not expect abstract positioning language alone to create trust.

---

# 24. Messaging principles

## Lead with benefits, prove with mechanisms

“YAML in GitHub” is evidence.

“Forms your team can maintain, review, and automate” is value.

Use both, in that order when speaking to broader audiences.

For strongly technical audiences, the order can be reversed.

## Explain before naming

Do not assume everyone knows what “Forms as Code” means.

Explain the behavior and then give the category a name.

## Make technicality feel empowering rather than exclusive

Avoid framing the product as belonging to an elite technical class.

The product should feel precise, not intimidating.

## Respect the tradeoff

There is no need to pretend YAML is objectively easier than a visual editor for every person.

For some users, a visual form builder will be easier.

The proposition is that explicit configuration creates different and valuable properties.

## Avoid anti-SaaS ideology

Traditional hosted form builders solve real problems well.

The case for Declarative Forms is strongest when it describes the circumstances under which its model is better—not when it caricatures other approaches.

## Keep AI claims grounded

AI can create and modify structured definitions.

That does not make every generated definition correct.

Validation, review, and preview remain valuable.

## Avoid vague developer clichés

Phrases such as “built for developers,” “developer-first,” or “by developers for developers” unnecessarily constrain the audience.

Prefer language describing actual behaviors and needs.

---

# 25. Voice and personality

Declarative Forms should sound:

**Direct.**
Explain what happens without unnecessary abstraction.

**Pragmatic.**
Focus on useful tradeoffs rather than ideology.

**Technically credible.**
Specific enough to withstand scrutiny.

**Welcoming.**
Do not use knowledge of Git or YAML as a status signal.

**Calm.**
Avoid AI hype and category theatrics.

**Transparent.**
State limitations and tradeoffs when they help someone decide whether the product fits.

**Opinionated.**
The product has a clear model and should not hide that model in an attempt to appeal to everyone.

A useful tonal principle is:

> **Technical enough to trust. Simple enough to approach.**

---

# 26. Terminology

Consistent terminology matters because several related concepts can otherwise be conflated.

### Declarative Forms

The product/project.

### frms.dev

The hosted service/domain.

### Forms as Code

The category or operating model.

### Form definition

The structured source artifact describing the form.

Prefer this over using “form” when the distinction between definition and rendered experience matters.

### Form

The experience a respondent interacts with, or the overall conceptual object when no distinction is required.

### Respondent

A person completing a form.

### Submission

The captured data and associated state produced through the form.

### Connection

A configured mechanism for sending submission information into another workflow.

### Hosted

Using an operated instance of Declarative Forms.

### Self-hosted

Running the open-source stack in infrastructure controlled by the user or organization.

### AI agent

Software capable of reading instructions and creating or modifying the form definition.

Do not make a single vendor or model synonymous with this role.

---

# 27. Copy guidance by audience

## Engineers

Lead comfortably with:

* definitions;
* Git;
* version control;
* schema;
* validation;
* source;
* self-hosting;
* runtime;
* automation.

They are likely to understand the mechanism quickly.

## Product managers and technical founders

Lead with:

* speed without custom infrastructure;
* explicit product logic;
* collaboration with engineering;
* iteration;
* AI-assisted creation;
* ownership.

## Operations teams

Lead with:

* maintainable workflows;
* repeatability;
* integrations;
* controlled changes;
* automation;
* visibility into how the form works.

Explain Git and YAML in plain language where necessary.

## AI-assisted generalists

Lead with:

* describe what you need;
* let an agent create the structured definition;
* review the result;
* retain an artifact you can continue to edit with any compatible tooling.

Do not imply they must become programmers.

## Infrastructure-conscious teams

Lead with:

* open source;
* self-hosting;
* inspectability;
* deployment choice;
* ownership of the definition and operating environment.

Avoid making compliance or security guarantees without evidence appropriate to those claims.

---

# 28. Guidance for product managers

When considering a feature, ask:

**Does this strengthen the declarative model or bypass it?**

**Does it make the definition easier for humans or agents to create and maintain?**

**Does it reduce unnecessary infrastructure work for users?**

**Does it preserve inspectability?**

**Does it increase the usefulness of Declarative Forms inside existing workflows?**

**Does it create genuine product leverage, or are we recreating an adjacent system?**

**Could a simple use case remain simple after this feature exists?**

**Would this decision make Declarative Forms more dependent on a proprietary interface than on the underlying definition?**

The answers should carry more weight than whether a feature is common in incumbent form builders.

---

# 29. Guidance for designers

The design challenge is unusual because the underlying model is technical while the intended audience is broader than developers.

Design should therefore make structure feel understandable.

Useful themes include:

* source and result shown together;
* clear cause and effect;
* visible workflow;
* progressive disclosure;
* understandable system state;
* transparent validation and errors;
* confidence when AI has created or changed something;
* easy movement between intent, definition, preview, and outcome.

Avoid assuming that making the product broader requires hiding the structured model.

The structure is part of the value.

The opportunity is to make that structure approachable.

The product should visually communicate:

> **“You can understand this.”**

rather than:

> **“You need to be a programmer to be here.”**

---

# 30. Guidance for copywriters

Before writing copy, identify which layer you are communicating:

1. **Outcome:** what the user achieves.
2. **Benefit:** why the product model improves their work.
3. **Mechanism:** how Declarative Forms does it.
4. **Proof:** evidence that the mechanism is real.
5. **Instruction:** what to do next.

Do not collapse all five into a sentence full of technical nouns.

A useful pattern is:

> **Outcome → mechanism → consequence.**

For example:

> Define the form in a structured file. Declarative Forms turns it into the working experience, so the definition remains something your team can inspect, review, and automate.

Avoid automatically defaulting to “for developers.”

Avoid automatically defaulting to “no-code.”

Neither accurately describes the strategic ambition.

---

# 31. Guidance for researchers

Researchers should distinguish between facts we know about the product and hypotheses we hold about the market.

The product architecture is observable.

The size, urgency, language, willingness to adopt, and strongest audiences are hypotheses until validated.

Research should therefore test rather than reinforce the strategy.

Particularly important questions include:

### Audience

Which non-engineering roles already work comfortably with structured configuration?

Which roles regularly collaborate with engineering around forms?

How commonly are AI coding or automation agents already used by these groups?

At what point does Git become an unacceptable adoption barrier?

### Problem

Which forms become painful enough that teams stop wanting them inside a traditional form builder?

What causes that transition?

Is the strongest pain ownership, reviewability, automation, integration, customization, infrastructure, or something else?

### Existing behavior

Where do teams currently keep form logic?

Who is responsible for changing it?

How are changes approved?

How often are forms duplicated across projects or environments?

How frequently do teams ultimately replace a SaaS form with a custom implementation?

### AI

Will users trust an agent to author the definition?

Do they need to understand the resulting YAML themselves?

What review or preview mechanisms create sufficient confidence?

Does AI meaningfully expand adoption beyond existing developer audiences, or simply accelerate the existing audience?

### Positioning

Does “Forms as Code” clarify the product or make it appear unnecessarily difficult?

Does “forms defined as files” communicate the idea more effectively to operations audiences?

Which benefits make the architecture feel valuable rather than merely novel?

### Open source and self-hosting

Are these adoption drivers, procurement requirements, trust signals, or mostly reassurance?

Which audiences require self-hosting versus merely valuing that it is possible?

### Switching and coexistence

Does Declarative Forms replace an existing form platform?

Does it initially serve forms traditional platforms handle poorly?

Does it coexist with incumbent tools inside the same organization?

Understanding the entry point may be more valuable than trying to prove that Declarative Forms should replace every form tool.

---

# 32. Strategic hypotheses to validate

The following should be treated as hypotheses, not established market facts.

**Hypothesis 1:** The addressable audience for configuration-based products is expanding beyond software engineers because AI substantially reduces the expertise required to manipulate structured files.

**Hypothesis 2:** Technical operations roles value inspectability, repeatability, and automation enough to accept more explicit configuration than traditional form builders require.

**Hypothesis 3:** “Forms as Code” is a strong category wedge for technical users but needs benefit-led translation for adjacent audiences.

**Hypothesis 4:** The most valuable forms are not necessarily the most complex ones; they are the ones embedded deeply enough in a workflow that ownership and maintainability begin to matter.

**Hypothesis 5:** AI-assisted authoring can turn the absence of a traditional drag-and-drop builder from a major limitation into a manageable tradeoff for a substantially broader audience.

**Hypothesis 6:** Open source and self-hosting increase trust even among users who initially choose the hosted service.

**Hypothesis 7:** The strongest long-term differentiation will come from the form definition becoming a composable organizational artifact—not from competing feature-for-feature with form-builder incumbents.

These should be revisited as evidence accumulates.

---

# 33. Evidence and claim discipline

Declarative Forms should communicate confidently about what its architecture genuinely supports.

It should avoid claims that are broader than the evidence.

In particular, do not automatically translate:

**“stored in Git”** into **“portable to every system.”**

**“open source”** into **“secure” or “compliant.”**

**“self-hosted”** into **“easy to operate at every scale.”**

**“AI can write the definition”** into **“AI always creates correct forms.”**

**“reviewable”** into **“the product provides enterprise governance.”**

**“structured”** into **“simple for everyone.”**

**“automatable”** into **“everything is automated.”**

Specific performance, adoption, reliability, compliance, productivity, or time-saving claims should be supported separately before being used.

Credibility is strategically important.

---

# 34. What should remain durable as the product evolves

Individual implementation details can change while the following remain true:

### The form has an explicit definition.

This is the foundation.

### The definition can exist independently of the authoring interface.

A future editor, CLI, agent, IDE integration, or other authoring experience should manipulate the underlying definition rather than replace it with inaccessible proprietary state.

### The platform executes the definition.

Users should not need to rebuild all the machinery required to turn the definition into a useful form.

### Users retain meaningful control.

Over the artifact, and where appropriate over the infrastructure.

### The system is friendly to automation.

Programmatic and agent-based workflows should remain natural.

### The product integrates with existing systems of work.

It should not require users to move their entire workflow into Declarative Forms.

### The respondent does not need to care about any of this.

The architectural philosophy should result in a good form, not additional complexity for the person completing it.

---

# 35. Strategic narrative

A useful long-form narrative for Declarative Forms is:

> Forms have traditionally lived in one of two places: inside a form builder or inside an application.
>
> A form builder is convenient, but the form becomes something you maintain through that product's interface. Building it yourself gives you control, but now you own the rendering, validation, submissions, storage, uploads, integrations, and everything else required to operate it.
>
> Declarative Forms takes a different approach.
>
> The form is a structured definition that you own. Today that means a human-readable file maintained in Git. Declarative Forms turns that definition into the working form and handles the surrounding runtime.
>
> That gives forms many of the properties teams already value in software and configuration: they can be inspected, versioned, reviewed, generated, copied, automated, and maintained alongside the systems they support.
>
> This used to be an approach primarily suited to developers.
>
> AI changes that.
>
> A product manager, operations specialist, researcher, marketer, consultant, or founder can increasingly describe what they want to an agent and have the structured definition created for them. They do not need a proprietary visual editor to be their only interface to the system.
>
> The underlying artifact remains understandable to humans, usable by machines, and under the user's control.
>
> Declarative Forms is built around that future.

---

# 36. The concise narrative

When only a few sentences are available:

> **Declarative Forms treats a form as a definition rather than an object inside a visual builder. Describe the form in a structured file, keep that definition in your workflow, and Declarative Forms turns it into the working experience. Because the definition is explicit, both people and AI agents can create, review, version, and automate it.**

---

# 37. The one-sentence narrative

> **Declarative Forms turns an owned, versionable form definition into a working form.**

---

# 38. The strategic promise

The broad promise should not be “we make forms easier.”

Many products can make that claim.

A more distinctive promise is:

> **Make forms part of your system of work without having to build the form system yourself.**

This captures both sides of the product:

**Control of the definition.**
**Leverage from the runtime.**

That tension is the core of Declarative Forms.

---

# 39. Decision lens for future work

When product, brand, design, or go-to-market questions are ambiguous, return to four questions:

### Is the form an asset the user controls?

If not, we are drifting toward a conventional builder model.

### Is the product doing meaningful execution work for the user?

If not, we are drifting toward being merely a schema or library.

### Can both humans and software meaningfully work with the definition?

If not, we are weakening the declarative and AI-native advantages.

### Does this reduce friction without hiding the underlying model?

If yes, it is likely aligned with the product's direction.

These questions should be useful long after individual features in the current product have changed.

---

# 40. Final perspective

Declarative Forms should not be positioned as a strange way to use YAML instead of clicking a form builder.

That framing begins with the incumbent interface and makes Declarative Forms look like the difficult alternative.

The larger idea is different:

**Forms are structured workflows. Their definitions deserve to be explicit, ownable, automatable artifacts.**

The software industry has already moved many important systems toward declarative configuration.

AI makes that operating model accessible to more people.

Declarative Forms applies it to forms while supplying the runtime that makes the definition useful.

The opportunity is therefore larger than “forms for developers.”

But the answer is not “forms for everybody.”

The product belongs to a growing class of **builders and operators who want software to be transparent, composable, automatable, and under their control—whether they write the underlying configuration themselves or collaborate with an agent that does.**

That is the audience.

That is the product philosophy.

And that is the position future product and communication work should reinforce.
