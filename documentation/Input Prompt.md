Platform Overview:
This is a multi-page web platform using React.js for the front-end, Tailwind CSS for styling, Node.js for server-side functionality, and D3.js for data visualizations. The platform is designed with a black-and-white aesthetic, focusing on a minimalist, clean, and modern UI. User interaction is driven by smooth animations, precise form inputs, and responsive behavior.

General Styling Details:
Aesthetic Elements:
● Background Color: Solid black (#000000), applied across all pages.
● Font:
  ○ Family: Proxima Nova.
  ○ Color: White (#ffffff).
  ○ Body Text:
    ■ Size: 14 pixels.
    ■ Color: Light gray (#EFEFEF).
    ■ Font Weight: 300.
● Header Text:
  ○ H1: 30px, Font weight 600.
  ○ H2: 25px.
  ○ H3: 20px.
  ○ H4: 18px, Font weight 600.
● Button Text:
  ○ Size: 16 pixels, capitalized.
  ○ Color: Black (#000000).
● Buttons:
  ○ Rounded with a border radius of 50% (left side).
  ○ Background: White (#ffffff), with black text.
  ○ No borders: 0 pixels.
Form Fields:
● Border Color: White, 3 pixels thick.
● Placeholder Text: Dark gray, centered, and capitalized.
● Font: Uppercase, H4 (18px), Font weight 600.

Page 1: Welcome Page
Layout:
● One section, full-screen.
● All content is centered both vertically and horizontally.
Text Animation:
● Display the large text "POLLEN8" in the center of the screen.
  ○ Fade-in Duration: 3 seconds.
  ○ Fade-out Duration: 1 second.
Button Appearance:
● After the text fades out, display a centered white button with capitalized black text that says "GET CONNECTED".
● Button style: White background, black text, 50% left-side border radius.
Phone Number Entry:
● Upon clicking the "GET CONNECTED" button, a phone number input field appears:
  ○ Border: 3px white.
  ○ Border-radius: 50%.
  ○ Background: Black.
  ○ Placeholder Text: Seven zeros "0000000," centered in the input field.
  ○ Placeholder Font Style: Dark gray, capitalized, centered.
Verify Button Interaction:
● Once a valid phone number is entered, display a white button below the field that says "VERIFY" in capital letters.
● The button pulses with a white outline for 4 seconds.
● After 4 seconds, the text on the button changes to "VERIFYING" (capitalized).
● The button then turns green with white text that says "VERIFIED."
● Clicking the "VERIFIED" button takes the user to Page 2.

Page 2: Onboarding Form
Form Layout:
● A stacked form layout appears, centered in the middle of the page, with three fields.
Field 1: Industry Selection:
● A drop-down checkbox field where users can select industries.
● The list will include multiple industry options like technology, healthcare, etc.
● Validation: The user must select at least 3 options before proceeding.
Field 2: Interest Selection:
● A second drop-down checkbox field for interests such as sports, gaming, etc.
● Validation: The user must select at least 3 interests.
Field 3: ZIP Code Entry:
● A numeric field where the user can enter their ZIP code.
● After entering a valid ZIP code, the nearest city will auto-populate the field.
● By default, the system will pre-select "New York."
Onboard Button:
● Below the form, a white button appears that says "ONBOARD" in capitalized letters.
● Clicking the "ONBOARD" button takes the user to Page 3.

Page 3: User Profile Page
Profile Banner:
● A profile banner appears at the top of the page with a pulsing white ring around the avatar.
● The banner has a black background.
Metadata Grid:
● Below the profile banner, a metadata grid displays the user's:
  ○ Selected industries.
  ○ Chosen interests.
  ○ Current location (city).
Action Buttons:
● Two rectangular buttons, responsive and stacked:
  Manage Invites (White background, black text).
  Manage Account (Black background, white text).
● Clicking "Manage Invites" takes the user to Page 4.
● Clicking "Manage Account" redirects to Page 5.

Page 4: Invite Management Page
Top Banner:
● A black banner at the top of the page with centered, capitalized, white text that says "INVITES" (H3).
● On the right-hand side, a white "X" button returns the user to Page 3.
Invite List:
● A list area contains three columns:
  Link Name.
  Generated Link URL.
  Click Count.
● Each list row expands into an accordion, which shows a 100px tall line graph displaying the link's activity over the last 30 days.
Generate Link Area:
● At the bottom, a button labeled "GENERATE LINK" with a link icon.
● After clicking the "Generate Link" button:
  ○ A text field appears in the list area with centered placeholder text: "ENTER A NAME."
  ○ After entering a name, a black button appears that says "CREATE."
  ○ Clicking "CREATE" adds a new link to the invite list.
Copy URL Function:
● Clicking and holding any row automatically copies the link URL to the clipboard.
● Clicking the "X" in the top-right corner returns the user to Page 3.

Page 5: Account Page
Header:
● A black header at the top of the page with a white pulsing orb on the left.
● On the right, an icon for generating invite links.
Profile Banner:
● The banner features an animated star constellation slowly moving across the black background.
● Username is displayed in the center with Proxima Nova Bold in white text.
Buttons Section:
● Below the banner are three black buttons:
  Connections: Shows the number of connections in the user's network.
  Network Value: Displays the user's network value, calculated at 3.14 per connection.
  Industry Networks: Opens a collapsible sidebar listing the industries the user is connected to.
    ■ The last option in the list is a list item that says "create network" with a plus icon next to it
Network Feed:
● Depending on the clicked button, the network feed adjusts dynamically:
  Clicking Connections: Displays a responsive grid of profiles the user is connected with.
  Clicking Network Value: Shows a black-and-white line graph that tracks network growth over the last year.
  Clicking any network in the network list sidebar loads a user update feed that consist of culture

Data & Graphs:
● D3.js is used for generating the line graph in Page 4 and the network growth graph in Page 5, making them interactive and responsive.

GPT Engineer results
onboarding
https://connecstack.gptengineer.run/
Profile
https://cosmic-network-canvas.gptengineer.run/