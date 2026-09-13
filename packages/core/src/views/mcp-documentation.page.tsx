import Link from 'next/link';

export function McpDocumentationPage(): React.JSX.Element {
  return (
    <div className="min-h-lvh bg-paper text-ink">
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap"
        rel="stylesheet"
      />
      <header className="border-b-2 border-ink">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16"
        >
          <Link
            className="font-display text-lg font-semibold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/"
          >
            Declarative Forms
          </Link>
          <a
            className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            href="https://github.com/declarativeforms/core#create-your-first-form"
          >
            Create from YAML
          </a>
        </nav>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-20 lg:px-16"
      >
        <div className="max-w-3xl">
          <p className="mb-6 inline-block -rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold">
            MCP documentation
          </p>
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Create and manage forms from your AI client.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Connect ChatGPT, Codex, or Claude to Declarative Forms with the
            Model Context Protocol (MCP). Describe the form you need, refine its
            YAML, and share a hosted form from the tools you already use.
          </p>
          <aside
            className="mt-8 rounded-lg border-2 border-ink bg-brand-purple-soft p-6 shadow-hard"
            aria-label="Where your form lives"
          >
            <h2 className="font-display text-xl font-semibold">
              Where your form lives
            </h2>
            <p className="mt-3 leading-relaxed text-ink-muted">
              MCP lets your AI client create and manage forms hosted by
              Declarative Forms. GitHub is used for sign-in; these forms are
              stored in Declarative Forms. To keep a form in your repository,
              copy its YAML into GitHub and use the repository URL.
            </p>
            <a
              className="mt-4 inline-block font-semibold underline underline-offset-4"
              href="https://github.com/declarativeforms/core#create-your-first-form"
            >
              Follow the GitHub and YAML quick start
            </a>
          </aside>
        </div>
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav
            aria-label="On this page"
            className="rounded-lg border-2 border-ink bg-white p-5 shadow-hard lg:sticky lg:top-6"
          >
            <p className="mb-4 text-sm font-semibold">On this page</p>
            <ul className="space-y-3 text-sm [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4">
              <li>
                <a href="#before-you-connect">Before you connect</a>
              </li>
              <li>
                <a href="#chatgpt-web">ChatGPT web</a>
              </li>
              <li>
                <a href="#codex-cli">Codex CLI</a>
              </li>
              <li>
                <a href="#claude-web">Claude web</a>
              </li>
              <li>
                <a href="#claude-code">Claude Code CLI</a>
              </li>
              <li>
                <a href="#create-and-edit">Create and edit forms</a>
              </li>
              <li>
                <a href="#keep-it-in-github">Keep it in GitHub</a>
              </li>
              <li>
                <a href="#response-delivery">Response delivery</a>
              </li>
              <li>
                <a href="#tools-and-workspaces">Tools and workspaces</a>
              </li>
              <li>
                <a href="#troubleshooting">Troubleshooting</a>
              </li>
              <li>
                <a href="#disconnect">Disconnect</a>
              </li>
            </ul>
          </nav>
          <article className="min-w-0 space-y-12 leading-relaxed text-ink-muted [&_section]:scroll-mt-6 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mb-4 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border-2 [&_pre]:border-ink [&_pre]:bg-white [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-ink [&_pre]:shadow-hard [&_code]:font-mono [&_code]:text-sm [&_code]:break-words [&_pre_code]:break-normal">
            <section id="before-you-connect">
              <h2>Before you connect</h2>
              <p>
                You need a GitHub account and a client that supports remote MCP
                servers with OAuth. Use this full server URL in every client:
              </p>
              <pre>
                <code>https://frms.dev/api/v1/mcp</code>
              </pre>
              <p>
                Choose OAuth when your client asks for authentication. Complete
                the GitHub sign-in and authorization flow in your browser. You
                do not need to supply a GitHub personal access token, API key,
                or your own OAuth client credentials.
              </p>
              <p>
                Signing in creates or reconnects your personal workspace. Use
                the same GitHub account across clients to access the same forms.
                Cloud hosting is free; your AI client may require a separate
                subscription or workspace approval.
              </p>
              <p>
                Connect the remote server directly using the steps below.
                Installing the repository’s plugin package is optional; a direct
                MCP connection does not automatically install its bundled skill.
              </p>
              <h3>Verify the connection without creating a form</h3>
              <p>
                After connecting any client, send this prompt. A successful
                connection returns your accessible workspaces without changing
                them:
              </p>
              <pre className="whitespace-pre-wrap">
                <code>
                  Use the Declarative Forms MCP connection to list my
                  organizations. Show which workspace is my default. Do not
                  create or change anything.
                </code>
              </pre>
              <p>
                Client labels and account access can change. Each setup section
                links to the provider’s official instructions.
              </p>
            </section>
            <section id="chatgpt-web">
              <h2>ChatGPT web</h2>
              <p>
                Use ChatGPT in your browser with developer mode available.
                Account eligibility and workspace policy determine whether you
                can add a custom MCP connection. On a managed workspace, your
                administrator may need to enable or approve it.
              </p>
              <ol>
                <li>
                  Open ChatGPT Settings, select{' '}
                  <strong>Security and login</strong>, and enable{' '}
                  <strong>Developer mode</strong>.
                </li>
                <li>
                  Open <a href="https://chatgpt.com/plugins">ChatGPT Plugins</a>{' '}
                  and select the plus button to add a connection.
                </li>
                <li>
                  Name it <strong>Declarative Forms</strong>. Use{' '}
                  <strong>Create and manage hosted YAML forms</strong> as the
                  description.
                </li>
                <li>
                  Under Connection, enter{' '}
                  <code>https://frms.dev/api/v1/mcp</code> as the public server
                  URL. Use OAuth authentication and complete GitHub sign-in when
                  prompted.
                </li>
                <li>Create the connection and review the discovered tools.</li>
                <li>
                  Start a new conversation, add Declarative Forms from the tools
                  menu, and send the read-only verification prompt above.
                </li>
              </ol>
              <p>
                If developer mode or connection creation is unavailable, check
                workspace policy and the{' '}
                <a href="https://developers.openai.com/plugins/deploy/connect-chatgpt">
                  official ChatGPT connection instructions
                </a>
                . You can also use the YAML quick start without connecting MCP.
              </p>
            </section>
            <section id="codex-cli">
              <h2>Codex CLI</h2>
              <p>
                Use an installed, current Codex CLI. Add the remote server from
                your terminal:
              </p>
              <pre>
                <code>{`codex mcp add declarativeforms --url https://frms.dev/api/v1/mcp
codex mcp login declarativeforms
codex mcp list`}</code>
              </pre>
              <p>
                Complete GitHub authorization in the browser opened by the login
                command. If adding the server already starts an OAuth login,
                finish that flow; the separate login command is also available
                for reconnecting.
              </p>
              <p>
                Start a new Codex session and send the read-only verification
                prompt. The server configuration belongs to your Codex
                configuration, not your repository’s form files.
              </p>
              <h3>Configure it manually instead</h3>
              <p>
                Add this entry to your existing{' '}
                <code>~/.codex/config.toml</code>, then run{' '}
                <code>codex mcp login declarativeforms</code>. Use either manual
                configuration or the add command; do not add a duplicate entry.
              </p>
              <pre>
                <code>{`[mcp_servers.declarativeforms]
url = "https://frms.dev/api/v1/mcp"`}</code>
              </pre>
              <p>
                See the{' '}
                <a href="https://learn.chatgpt.com/docs/extend/mcp?surface=cli">
                  official Codex MCP documentation
                </a>{' '}
                for installation context, configuration, and authentication
                options.
              </p>
            </section>
            <section id="claude-web">
              <h2>Claude web</h2>
              <p>
                Use Claude in your browser with custom connectors available on
                your account. Managed accounts also need an organization owner
                to add the connector.
              </p>
              <h3>Individual accounts</h3>
              <ol>
                <li>
                  Open <strong>Customize → Connectors</strong>.
                </li>
                <li>
                  Select <strong>+ → Add custom connector</strong>.
                </li>
                <li>
                  Name it <strong>Declarative Forms</strong> and enter{' '}
                  <code>https://frms.dev/api/v1/mcp</code> as the remote MCP
                  server URL.
                </li>
                <li>
                  Leave optional OAuth client ID and client secret fields empty,
                  then select <strong>Add</strong>.
                </li>
                <li>
                  Select <strong>Connect</strong> and complete GitHub
                  authorization.
                </li>
                <li>
                  Open a conversation, enable Declarative Forms from the
                  connectors menu, and send the read-only verification prompt.
                </li>
              </ol>
              <h3>Team and Enterprise accounts</h3>
              <p>
                An organization Owner or Primary Owner first opens{' '}
                <strong>
                  Organization settings → Connectors → Add → Custom → Web
                </strong>{' '}
                and adds the same server URL. Members then open{' '}
                <strong>Customize → Connectors</strong>, find Declarative Forms,
                and connect using their own GitHub accounts.
              </p>
              <p>
                Each member authenticates separately. Adding the connector to a
                Claude organization does not grant membership in a Declarative
                Forms workspace.
              </p>
              <p>
                See the{' '}
                <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp">
                  official Claude custom-connector guide
                </a>{' '}
                for current account availability and connector limits.
              </p>
            </section>
            <section id="claude-code">
              <h2>Claude Code CLI</h2>
              <p>
                Use an installed, current Claude Code CLI. Run this command in
                the project where you want the connection available:
              </p>
              <pre>
                <code>
                  claude mcp add --transport http declarativeforms
                  https://frms.dev/api/v1/mcp
                </code>
              </pre>
              <p>
                The default local scope makes this configuration available to
                you in that project without writing a shared repository
                configuration.
              </p>
              <ol>
                <li>
                  Start Claude Code with <code>claude</code>.
                </li>
                <li>
                  Run <code>/mcp</code>, select Declarative Forms, and choose
                  its authentication option.
                </li>
                <li>Complete GitHub authorization in your browser.</li>
                <li>
                  Return to Claude Code and use <code>/mcp</code> to check the
                  connection.
                </li>
                <li>Send the read-only verification prompt.</li>
              </ol>
              <p>
                From your terminal, <code>claude mcp list</code> shows server
                status and <code>claude mcp get declarativeforms</code> shows
                the saved configuration. See the{' '}
                <a href="https://code.claude.com/docs/en/mcp">
                  official Claude Code MCP documentation
                </a>{' '}
                for other scopes and authentication options.
              </p>
            </section>
            <section id="create-and-edit">
              <h2>Create and edit forms</h2>
              <h3>Create your first form</h3>
              <p>
                <strong>New MCP forms are immediately public on main.</strong>{' '}
                They are not unpublished drafts. Preview links for other
                branches are public too, so keep secrets and private content out
                of your form definition.
              </p>
              <p>
                Try this prompt after connecting. It explicitly requests
                creation and a live form:
              </p>
              <pre className="whitespace-pre-wrap">
                <code>
                  Use Declarative Forms to create a live beta-access form in my
                  personal workspace. Read the schema and authoring guide first.
                  Collect a required, valid email address and a required
                  description of what the applicant is building. Add a clear
                  completion message. Do not add extra questions or promise
                  email delivery. Return the public URL and the complete YAML.
                </code>
              </pre>
              <p>
                Open the returned URL to review the form. Use the YAML to
                inspect its fields, validation, completion message, and any
                configured connections. Ask your client for refinements when
                needed.
              </p>
              <h3>Preview an edit before publishing</h3>
              <p>
                For an existing form, ask your client to read its current
                definition, create a branch, and update that branch:
              </p>
              <pre className="whitespace-pre-wrap">
                <code>
                  Find my beta-access form and read its current YAML. Create a
                  branch named clearer-copy, update the project question to
                  “What are you building, and who is it for?”, and preserve the
                  other fields and settings. Return the preview URL and
                  summarize the change. Do not publish or update main.
                </code>
              </pre>
              <p>
                If more than one form matches, select the intended form before
                editing. Review the returned branch preview, then explicitly ask
                the client to publish that branch to main when you are happy.
                Publishing replaces main with the branch definition and leaves
                the source branch available.
              </p>
              <p>
                Managed branches are separate from GitHub branches. Updates
                replace a branch’s complete YAML and are last-write-wins;
                coordinate edits when several people maintain the same form. Ask
                the client to confirm before publishing or deleting. A direct
                connection uses the server’s guidance; the optional bundled
                skill adds authoring instructions, but neither replaces your
                review.
              </p>
            </section>
            <section id="keep-it-in-github">
              <h2>Keep it in GitHub</h2>
              <p>
                The MCP server does not commit form definitions to GitHub or
                automatically synchronize them with a repository. To make Git
                your source of truth:
              </p>
              <ol>
                <li>
                  Ask your client to read the form and return its complete YAML.
                </li>
                <li>
                  Save that definition as <code>forms/beta-access.yaml</code> in
                  a public GitHub repository. Review any email recipients,
                  webhook URLs, and other content before making the file public.
                </li>
                <li>
                  Review and commit the file to <code>main</code>, or preview it
                  on another branch before merging.
                </li>
                <li>Open and share the repository-backed URL below.</li>
              </ol>
              <pre>
                <code>{`https://frms.dev/your-org/your-repo/forms/beta-access
https://frms.dev/your-org/your-repo/forms/beta-access?branch=my-form`}</code>
              </pre>
              <p>
                Replace the owner, repository, and path with yours; omit the{' '}
                <code>.yaml</code> extension. The hosted service uses{' '}
                <code>main</code> by default, so specify a branch when your
                repository uses a different default.
              </p>
              <p>
                The repository-backed form has its own URL and is separate from
                the managed form. Copying YAML does not move previous responses
                or remove the managed form. After switching, maintain the
                repository file and share its URL rather than continuing to edit
                the managed copy.
              </p>
              <p>
                A coding agent can also create the file directly in your
                repository without MCP. The{' '}
                <a href="https://github.com/declarativeforms/core#create-your-first-form">
                  YAML quick start
                </a>{' '}
                includes a ready-to-use prompt.
              </p>
            </section>
            <section id="response-delivery">
              <h2>Response delivery</h2>
              <p>
                Receiving responses by email or webhook requires a connection in
                the form definition. Creation alone does not configure
                notifications.
              </p>
              <p>
                Ask your client to add an email connection using your actual
                recipient address, or a webhook connection using your
                application’s endpoint. For an existing managed form, preview
                the change on a branch before publishing.
              </p>
              <pre>
                <code>{`connections:
  - type: email
    to: "team@example.com"
    subject: "New beta-access response"
    body: "A new response came in."
    include_responses: true`}</code>
              </pre>
              <p>
                Replace the example recipient before use. To deliver to an
                application instead:
              </p>
              <pre>
                <code>{`connections:
  - type: webhook
    url: "https://example.com/hooks/beta-access"`}</code>
              </pre>
              <p>
                By default, connections run for completed submissions. Delivery
                is queued, rather than guaranteed to be immediate. Submit a test
                response and confirm it reaches the configured destination.
                Self-hosted email delivery also requires server-side Resend
                configuration.
              </p>
              <p>
                See the{' '}
                <a href="https://github.com/declarativeforms/core/blob/main/SCHEMA.md#connections">
                  connection reference
                </a>{' '}
                for conditions, delays, partial-submission triggers, and
                self-hosted requirements.
              </p>
            </section>
            <section id="tools-and-workspaces">
              <h2>Tools and workspaces</h2>
              <div className="overflow-x-auto rounded-lg border-2 border-ink bg-white">
                <table className="w-full text-left text-sm [&_th]:p-4 [&_th]:font-semibold [&_th]:text-ink [&_td]:border-t [&_td]:border-ink/20 [&_td]:p-4">
                  <caption className="sr-only">
                    Available Declarative Forms MCP tools
                  </caption>
                  <thead className="bg-paper-alt">
                    <tr>
                      <th scope="col">Tools</th>
                      <th scope="col">What they do</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>list_forms</code>, <code>read_form</code>
                      </td>
                      <td>
                        Find forms and read a branch’s YAML, revision, and URLs.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>create_form</code>
                      </td>
                      <td>
                        Create a form on main with an immediately available
                        public URL.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>update_form</code>, <code>rename_form</code>
                      </td>
                      <td>
                        Replace a branch’s complete YAML or rename a form across
                        branches.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>list_branches</code>, <code>create_branch</code>
                      </td>
                      <td>
                        List previews or copy an existing branch, main by
                        default.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>publish_branch</code>
                      </td>
                      <td>
                        Publish a non-main branch to main while keeping the
                        source branch.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>delete_branch</code>, <code>delete_form</code>
                      </td>
                      <td>
                        Remove a non-main branch, or make a form and all its
                        branches unavailable.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>list_organizations</code>
                      </td>
                      <td>
                        Discover accessible workspaces, organization IDs, and
                        your roles.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>add_organization_member</code>
                      </td>
                      <td>
                        Let an admin grant organization membership immediately.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h3>Select a workspace</h3>
              <p>
                Form and branch tools default to your personal workspace. To
                work in another organization, first list your organizations,
                select one by name, and ask your client to use its returned{' '}
                <code>organization_id</code> for subsequent operations. Both
                admins and members can manage forms and branches.
              </p>
              <p>
                Only admins can add organization members. This grants access
                immediately without an invitation email or acceptance step; the
                default role is member. Adding an existing member preserves
                their role.
              </p>
              <h3>Authoring resources</h3>
              <p>
                The server exposes <code>declarativeforms://schema</code> and{' '}
                <code>declarativeforms://authoring-guide</code>. Ask your client
                to read both before writing YAML. The public{' '}
                <a href="/schema.json">JSON Schema</a> and{' '}
                <a href="https://github.com/declarativeforms/core/blob/main/SCHEMA.md">
                  human-readable schema reference
                </a>{' '}
                are also available.
              </p>
            </section>
            <section id="troubleshooting">
              <h2>Troubleshooting</h2>
              <ul>
                <li>
                  <strong>No custom-connection option:</strong> Check your
                  provider’s current account requirements and workspace policy.
                  For managed Claude accounts, an organization owner must add
                  the connector first.
                </li>
                <li>
                  <strong>Cannot connect:</strong> Use the complete HTTPS
                  endpoint, including <code>/api/v1/mcp</code>. Choose remote
                  HTTP transport in a CLI client, rather than a local server
                  command.
                </li>
                <li>
                  <strong>Authentication required or expired:</strong> Reconnect
                  through your client’s OAuth flow. In Codex, run{' '}
                  <code>codex mcp login declarativeforms</code>; in Claude Code,
                  use <code>/mcp</code>. Sign in with the intended GitHub
                  account.
                </li>
                <li>
                  <strong>Connected, but no tools used:</strong> Enable the
                  connection in the current web conversation or start a new CLI
                  session, then explicitly ask it to use Declarative Forms.
                </li>
                <li>
                  <strong>Missing form or access denied:</strong> List
                  organizations and forms in the intended workspace. Do not
                  invent a form ID or assume that your AI workspace grants
                  access to a Declarative Forms organization.
                </li>
                <li>
                  <strong>YAML rejected:</strong> Read the current schema and
                  authoring guide, correct the reported validation issues, and
                  retry with the complete definition.
                </li>
                <li>
                  <strong>No email or webhook received:</strong> Check the
                  connection configuration, complete a test submission, and
                  confirm the destination. Delivery is queued; self-hosted
                  instances also need their scheduler and delivery services
                  configured.
                </li>
              </ul>
              <p>
                If the issue persists,{' '}
                <a href="https://github.com/declarativeforms/core/issues">
                  report it on GitHub
                </a>{' '}
                with your client name and version, the failed step, and the
                error message. Leave out tokens, private responses, and other
                sensitive account details.
              </p>
            </section>
            <section id="disconnect">
              <h2>Disconnect</h2>
              <p>
                In ChatGPT or Claude web, open the connection’s settings and
                disconnect or remove Declarative Forms. In Codex CLI:
              </p>
              <pre>
                <code>{`codex mcp logout declarativeforms
codex mcp remove declarativeforms`}</code>
              </pre>
              <p>
                In Claude Code CLI, remove the local connection from the project
                where you added it:
              </p>
              <pre>
                <code>claude mcp remove declarativeforms</code>
              </pre>
              <p>
                Disconnecting a client does not delete hosted forms or unpublish
                their URLs. Form deletion is a separate action; review the
                intended form and explicitly approve deletion before asking your
                client to remove it.
              </p>
            </section>
          </article>
        </div>
      </main>
      <footer className="border-t-2 border-ink px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted md:px-4 lg:px-10">
          <Link className="underline underline-offset-4" href="/">
            Forms as Code for GitHub-native teams.
          </Link>
          <Link className="underline underline-offset-4" href="/privacy-policy">
            Privacy
          </Link>
          <a
            className="underline underline-offset-4"
            href="https://github.com/declarativeforms/core"
          >
            Source
          </a>
        </div>
      </footer>
    </div>
  );
}
