import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addReview } from "../../store/reducers/reviewsSlice";
import RatingStars from "./RatingStars";
import { useT } from "../../i18n/useT";

// Parent decides *whether* to render this (only for logged-in users); it stays defensive
// and renders nothing if there's somehow no user, rather than submitting an invalid review.
export default function ReviewForm({ productId, onSubmitted }) {
  const { t } = useT();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { addStatus, addError } = useSelector((s) => s.reviews);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  if (!user) return null;

  const errors = {
    rating: rating < 1 ? t("Please select a rating.") : null,
    title: title.trim() ? null : t("Please add a title."),
    comment: comment.trim() ? null : t("Please add a comment."),
  };
  const isValid = !errors.rating && !errors.title && !errors.comment;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    dispatch(
      addReview({
        productId,
        userId: user.id,
        userName: user.name,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified: true,
        helpful: 0,
        createdAt: new Date().toISOString(),
      })
    ).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setRating(0);
        setTitle("");
        setComment("");
        setTouched(false);
        onSubmitted?.();
      }
    });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <div className="mb-3">
        <span className="form-label small fw-semibold d-block">{t("Your rating")}</span>
        <RatingStars value={rating} onChange={setRating} size="1.5rem" />
        {touched && errors.rating && <p className="text-danger small mt-1 mb-0">{errors.rating}</p>}
      </div>

      <div className="mb-3">
        <label htmlFor="review-title" className="form-label small fw-semibold">
          {t("Title")}
        </label>
        <input
          id="review-title"
          type="text"
          className={`form-control${touched && errors.title ? " is-invalid" : ""}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("Sum up your experience")}
        />
        {touched && errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="review-comment" className="form-label small fw-semibold">
          {t("Comment")}
        </label>
        <textarea
          id="review-comment"
          className={`form-control${touched && errors.comment ? " is-invalid" : ""}`}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("What did you like or dislike?")}
        />
        {touched && errors.comment && <div className="invalid-feedback">{errors.comment}</div>}
      </div>

      {addStatus === "failed" && (
        <div className="alert alert-danger py-2 small" role="alert">
          {addError ? t(addError) : null}
        </div>
      )}

      <button type="submit" className="btn btn-accent" disabled={addStatus === "loading"}>
        {addStatus === "loading" ? t("Submitting...") : t("Submit review")}
      </button>
    </form>
  );
}
