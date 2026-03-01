I want you to analyse this project with the focus on the following: the runtime of the form and the rendering of the form.

You should look at it from the perspective of a senior principal engineer.

Once you have a good understanding, I want you to execute each of the following steps:

- Define the boundaries between what is the form runtime boundary and what is the rendering boundary
- Create a clear understanding and plan of what should be included as part of the runtime and what should fall under the rendering. The idea is the keep the core of the form logic, validation, localization,etc contained which is labelled as the runtime and the the rendering side is purely about the react components. This would allow us the in future create different renderings of the form without modificying the core logic.
- Once you have a clear plan, break it down into smaller plans.
- Execute these plans to finally split the runtime and rendering.



I want you to refine the runtime implementation by create a clearer struture and layered approach. At the moment it seems like a lot of logic scattered with not clear flow from left to right. I want to see a distinct flow from input schema to output which then gets rendered. I still want to keep the current functionality and features but want to see the input being transformed into a single output which can then be used by the rendering section. This would make it much easier to understand, follow and maintain. You still have other layers or structures in place such as for validation, etc. but I want to see a linear flow. For navigation, form state or other areas where you need interaction with the rendering side, they can be action/callback or a smarter implemetnation on the output represnetation which would interact with the runtime and then produce again another output schema which can be rendered.

Instead of executing this task as I've described it, I want you to unpack it as a technical architect and break it down into it's technical component before creating a detailed plan. The goal of this runtime layer is to have it understandable and isolated so that we can open source it and have the way in which forms are created in the industry distrupted. In the longer term, we how that this project becomes the standard for defining forms using YAML, similarly to how yaml has taken over how instrastructure is define as code.

Here is some guidance: 

- The schema in which the form is currently define should remain as is
- The first step should be to transform the input into a compiled version which does the templating and then localization
- This would mean that that the form state is maintain separately so that the templating can be done.
- The validation should be handled in a smart way, ideally there should be a method which recompiles the form based on the changes of the state which then runs validation and then set's it on the compiled form which can be rendered. This should be done in a optimized manner and perhars oly on submission of a section. The rendering side could have it's own implementaton of validation which could make it feel more realtime.
- For transitioning through sections, redirects, etc, have a dispact mechasihgm which can be called, returns a result which can then be actioned. This can then include a recompliation of the form with the new data and then renders the next section. 
- There should also be a main state which holds the compiled form, current data, current section/step and other global properties. This way the runtime state is all contained and can be passed to the rendering engine.
- I want the abstractions to be limited. Dont overengineer the solution.
- Follow a similar coding style to the rest of this project.


Ask atleast 10 clarifying questions about the architecture of this solution which I will confirm with you. 

1. The runtime can be coupled to react but only native react components such as useState, useEffect and not any of the react-form-hook or other third-party libraries.
2. It should compile the full form, and for templating or other dynamic part, it should recompile.
3. It should be the ful shape without a reference object to the active section. The active section should be named but the rendering engine will pull the correct section to render based on this property storing the active section.
4. The visible_when should be done on compliation. 
5. The runtime should produce validation as data but very similar to how it's stored at the moment, if it produces a new data structure it should allow for further expansion such as more validation rules or multiple patterns where at the moment there might only be one.
6. The dispatch mechanism should produce a new compiled form which the renderer can then use. This keeps the logic contained to the runtime.
7. The state container should be self contained which the renderer accpets as an input and gets a new state container when it changes which it can then render again.
8. The runtime should be aware of everything but IO should live outside of the runtime and can be handled by the main page or elsewhere. Think about a good way of structing this since IO should not live in the runtime nor the rendering engine. This is separate the thr IO which are used by fields themselves such as uploading files or pulling autocomplete data, this should exist in the rendering engine since it's the implementation of the field. The base IO such as the submission, pulling of the form, etc, should live in neither. This would allow us to swap out the backend for a completely different system.
9. Analystics and side effects should also not exist in the runtime or rendering.
10. Keep the new Function expression for now.
11. Keep it in place, for now everything can be in this repository.





Here's a few adjusments i want you to make. Analyze each of them to make sure you understand it and then build a plan. You can ask clarifying questions to help implement a better plan.

- On the compile-validation.ts, I want you to fix the default error message to be localized.
- Instead of only having a min and max validator on the IDeclarativeFormValidator, which then needs to be unpacked into a min_length and max_length, make it more explict, add the min_length and max_length to the IDeclarativeFormValidator and update the other code accordingly.
- In the CompiledField, I don't want the OTP, min_label, etc to be stored at this level, since they are specific to certain fields. This is not a maintainable way of doing it, find a better appraoch. If you need to change the structure completely of how the otp, min_label_ max_label, outputFormat, searchable is place and it could greatly benefit the project, you can restructure it. As long as it's clean, logical and maintainable. We'll continue having unique properties for given fields.
- On the form action for submit_section, instead of sectionData, have it as data.
- For the tempalte.ts file, I want to use handlebars templating instead of find/replace.




claude --resume c7716445-683f-431d-af35-ded53c2f9fc6