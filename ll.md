This repository is for a product called Declarative Forms. It's primary purpose is to serve as a survey/form tool which is mainly driven by YAML files. This allows anyone to create a YAML file which their preferred tool and then let us render it. Additionally these YAML files can be hosted in a public or private GitHub repository. Lastly, for the non tech savvy individuals, there's a form builder which allows anyone to build a form.

This project is not complete to it's fully capacity and could benefit from a lot of improvements. Instead of identifying these gaps and implementiong custom solutions we want to use the FormBricks project for guidance and inspiration. 

Have a look at the `/Users/barenderasmus/development/examples/formsbricks` project and analyse it so that you can have a good graps of how it approaches the implementation. You should look at it from an principal software engineer point of view. Then I want you to look at each of the components and subcomponents of this Declarative Forms project and compare it with that of FormBricks. Find the gaps as well as appraoches or implementations that can benefit the Declarative Forms project. 

The objective is to produce an extensive proposal document in a markdown file for the gaps and benefits and changes.

---

I want you to use the FORMBRICKS_COMPARATIVE_PROPOSAL.md document as a guideline to help me make improvements to the project. I primary goals is to make impactful improvements while still keeping the project simple, easy to understand without an unessarry layering or abstractions. I believe the biggest areas that it can leverage from FormBricks is the UI builder and the functionality gaps.

---

You're a senior software engineer working along side a product manager. Between the two of you, you need to revamp the project to align with the vision below. Each of you should work independantly but collobaratively. Keep you strenghts in mind and leverage eachothers skills.

I want you to analyse this project broadly so that you have a good overview of it, then I want you to review the project according to the vision below before creating an incremental plan on how to align it, and then execute the plan.

This vision of this project is as follows, in order of importance:

- We no longer need a studio project, remove the studio project and all the endpoints and dependancies related to it
- The internal architechture should follow this pattern, a YAML form definition, then a view reprensetnation of it which is the compiled version for a given section, followed by the rendering engine which will display the given section.
- The core compilation and rendering should be isolated into a packages so that anyone can build ontop of it in the future and plug in their own visual components to it.
- This project should be easy to understand, follow the flow from one side to the other and be easy for a newby to graps. The concepts should also remain intuatitve. We value ease of understanding over performance and robustness. Don't overengineer any aspect of it. Keep the code changes limited. We don't want to overuyse types, functions or layering, we only want to use them in place which truly help with ease of understanding and maintenance.
- The project should primary serve this fucntionality, render forms from a YAML file which could existing in a private or public GitHub repository or create/update forms using the API
- Since this project won't have an UI interface, the API will be used by another application such as Zapier or perhaps an AI skills (Claude or Codex)
- This project should be self-hosted using Docker/Docker Compose with Traefik (including Let's encrypt certificates). It should be easy for a new user to deploy and setup
- If there's areas in the project that can be simplied, collapse or renegineered to align with the objectives, do so with caution.

For reference, you can use FormBricks, you can learn from them on how to approach some of the challenges or changes as well as how to create a neat open source self hosted project.

Ask clarification questions where needed, I'll act as the product owner and the software engineer should always consult with the product manager and it the product manager can't resolve it, it should prompt me to select the best considerd options.

Don't commit anyting to git yet.
