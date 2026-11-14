import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GuideSection = {
  title: string;
  objections: string[];
  response: string;
  ask: string;
  value: string[];
  next: string;
};

const rejectionSections: GuideSection[] = [
  {
    title: "Satisfied with Existing System",
    objections: ["We already have a POS system.", "We already accept online orders.", "We use Foodpanda or other delivery platforms.", "We already have a website."],
    response: "That's great. Dine App isn't necessarily intended to replace your existing POS or ordering system. It provides an additional direct channel where customers can browse your menu, place orders or make reservations without always depending on third-party marketplaces.",
    ask: "Do you currently have a way for customers to order directly from your restaurant or make reservations through your own channels?",
    value: ["Branded online menu accessible through QR codes and direct links.", "Direct ordering for dine-in, takeaway and delivery.", "Reservation management.", "Direct customer engagement."],
    next: "Explore whether the restaurant wants more direct customer orders or reservations alongside its existing channels.",
  },
  {
    title: "Prefer Manual Processes",
    objections: ["We take orders over the phone.", "Customers just WhatsApp us.", "We manage reservations in a diary.", "Our staff can handle everything manually."],
    response: "That works when the volume is manageable. The challenge often comes during busy periods when staff need to handle customers, phone calls, WhatsApp messages, orders and reservations simultaneously. Dine App can help organize these activities through a digital ordering and reservation channel.",
    ask: "During busy hours, do you ever experience missed calls, delayed responses or confusion with orders and reservations?",
    value: ["Online menus accessible without calling the restaurant.", "Digital ordering and reservation requests.", "Order status tracking, including Waiting, Preparing and Ready to Collect.", "Less manual coordination for supported ordering workflows."],
    next: "Identify one activity that creates unnecessary work for restaurant staff.",
  },
  {
    title: "No Perceived Business Value",
    objections: ["We don't need another ordering application.", "Our customers already know us.", "We get enough customers.", "We don't see how this will increase business."],
    response: "Understood. The objective isn't simply to add another application. Dine App helps restaurants build direct relationships with their customers through branded ordering, reservations and loyalty features. It also gives customers a convenient way to interact with your restaurant.",
    ask: "Do you currently maintain your own customer database or have a way to encourage customers to order directly from you again?",
    value: ["Customer profiles and order history.", "Loyalty features to encourage repeat visits and orders.", "Direct ordering links and QR menus.", "Customer feedback and engagement through WhatsApp."],
    next: "Demonstrate how the restaurant could encourage repeat business and strengthen direct customer relationships.",
  },
  {
    title: "Budget / Cost Concerns",
    objections: ["We cannot afford another monthly subscription.", "Delivery platforms are already expensive.", "We don't want additional operating costs.", "We don't know whether it will generate enough business."],
    response: "That's understandable. Every additional operating expense needs to justify itself. Dine App provides a branded direct ordering and reservation channel, along with customer engagement features. We can first understand your requirements and see whether the benefits make commercial sense for your restaurant.",
    ask: "Is your main concern the monthly cost, the initial setup, or whether customers will actually use the platform?",
    value: ["Direct ordering as an additional sales channel.", "Customer retention and loyalty.", "Reduced dependence on third-party channels where direct ordering is appropriate."],
    next: "Arrange a discussion about the restaurant's requirements and commercial options. Never promise savings or increased revenue without supporting figures.",
  },
  {
    title: "Complexity / Staff Resistance",
    objections: ["Our staff won't use another system.", "We don't have time to train employees.", "We are already using several applications.", "We don't want to complicate restaurant operations."],
    response: "I completely understand. Restaurant staff already have a lot to manage. The idea is to make ordering and reservations more organized, not add unnecessary work. We can show you the customer ordering experience and how staff handle incoming orders and their statuses.",
    ask: "Would your main concern be staff training, managing orders during busy hours, or having to use another system alongside your existing POS?",
    value: ["Digital menus through QR codes and direct links.", "Organized order statuses.", "Centralized handling of supported ordering and reservation activities.", "Multi-branch reservation capabilities for applicable restaurant groups."],
    next: "Offer a short product demonstration focused on the restaurant's actual workflow.",
  },
  {
    title: "Security / Integration Concerns",
    objections: ["We already have a POS or restaurant management system.", "We don't want to enter orders twice.", "We are concerned about customer data.", "We don't want another disconnected system."],
    response: "That's a valid concern. Restaurants should not have to disrupt their existing operations just to introduce a new ordering channel. We can first understand which POS, CRM or other systems you currently use and assess the integration requirements.",
    ask: "Which POS or restaurant management system are you currently using?",
    value: ["Direct customer ordering and reservations.", "Customer profiles and order history.", "Potential integration with existing business systems, subject to technical assessment.", "Configurable workflows for restaurant operations."],
    next: "Refer integration, hosting and data-security questions to the technical team. Do not promise an integration until it has been verified.",
  },
];

function DineAppCallerGuide() {
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
        <p><b className="text-foreground">Company:</b> Step 2 Agility</p>
        <p><b className="text-foreground">Product:</b> Dine App</p>
        <p><b className="text-foreground">Audience:</b> Restaurant owners, managers and decision-makers</p>
      </div>
      <section>
        <h3 className="font-bold">Goal</h3>
        <p className="mt-1 rounded-xl bg-accent/10 p-3 font-medium text-foreground">The goal is not to convince every restaurant to adopt Dine App. The goal is to identify restaurants that could benefit from a direct ordering, reservation and customer engagement channel.</p>
      </section>
      <section>
        <h3 className="font-bold">Objective</h3>
        <p className="mt-1">Understand why a restaurant is hesitant to adopt Dine App, address the concern with a relevant operational benefit, and identify whether there is an opportunity for further discussion.</p>
        <p className="mt-2 text-muted-foreground">Do not pressure restaurant owners. Focus on practical improvements to ordering, reservations and customer relationships.</p>
      </section>
      {rejectionSections.map((section, index) => (
        <section key={section.title} className="border-t border-border pt-4">
          <h3 className="font-bold">{index + 1}. {section.title}</h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typical objections</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{section.objections.map(item => <li key={item}>{item}</li>)}</ul>
          <p className="mt-3"><b>Caller response:</b> “{section.response}”</p>
          <p className="mt-2"><b>Ask:</b> “{section.ask}”</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dine App value to highlight</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{section.value.map(item => <li key={item}>{item}</li>)}</ul>
          <p className="mt-2"><b>Suggested next step:</b> {section.next}</p>
        </section>
      ))}
      <section className="border-t border-border pt-4">
        <h3 className="font-bold">7. Common Conversation Closing</h3>
        <div className="mt-2 space-y-2">
          <p><b>When interested:</b> “Would you be open to a short demonstration? We can show you how customers browse your menu, place orders and make reservations through your own branded channel.”</p>
          <p><b>When more information is requested:</b> “I can arrange for our team to share some information and follow up with you. Would that be convenient?”</p>
          <p><b>When not ready:</b> “No problem. Would you prefer that we contact you another time, or would you rather get in touch when you are ready?”</p>
          <p><b>When the restaurant declines:</b> “Understood. Thank you for your time. I appreciate it.”</p>
          <p className="text-muted-foreground">If the restaurant requests no further contact, respect that request and record it immediately.</p>
        </div>
      </section>
      <section className="border-t border-border pt-4">
        <h3 className="font-bold">8. Caller Rules</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Always introduce yourself as calling from <b>Step 2 Agility</b>, not as a representative of a separate software company.</li>
          <li>Refer to Dine App as a product offered by Step 2 Agility.</li>
          <li>Do not start by explaining every feature. Identify the restaurant's current ordering and reservation process first.</li>
          <li>Never suggest that the restaurant must abandon Foodpanda, its POS or existing systems.</li>
          <li>Focus on direct ordering, customer relationships, loyalty and operational convenience.</li>
          <li>Avoid promising increased sales, guaranteed savings or specific marketplace commission reductions.</li>
          <li>Ask one question at a time and let the restaurant owner explain their situation.</li>
          <li>Record the actual objection and its reason in the CRM.</li>
          <li>Offer a demonstration only when there is genuine interest.</li>
          <li>Respect a clear rejection or request not to be contacted.</li>
        </ol>
      </section>
    </div>
  );
}

export function ProductHelpDialog() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("dine-app-caller-guide");

  return (
    <>
      <button
        type="button"
        data-testid="button-product-help"
        aria-label="Open product help"
        onClick={() => setOpen(true)}
        className="press grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
            <DialogTitle>Product help</DialogTitle>
            <DialogDescription>Guides and talking points for your current product.</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 md:grid-cols-[13rem_minmax(0,1fr)]">
            <nav className="border-b border-border bg-muted/30 p-3 md:border-b-0 md:border-r" aria-label="Help topics">
              <button
                type="button"
                data-testid="topic-dine-app-caller-guide"
                onClick={() => setTopic("dine-app-caller-guide")}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${topic === "dine-app-caller-guide" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Dine App Caller Guide
              </button>
            </nav>
            <div className="min-h-0 overflow-y-auto p-5 [overscroll-behavior:contain]">
              {topic === "dine-app-caller-guide" && <DineAppCallerGuide />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
