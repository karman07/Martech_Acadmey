"use client";

import ContentSubNav from "../_components/ContentSubNav";
import ContentTypeList from "../_components/ContentTypeList";

export default function CoursesReviewPage() {
  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">Content Review</h1>
      <p className="mt-1 text-sm text-muted">Approve, reject, or adjust the platform margin on submitted content.</p>

      <ContentSubNav />
      <ContentTypeList contentType="courses" />
    </div>
  );
}
