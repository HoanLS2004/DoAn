using System;
using System.ComponentModel.DataAnnotations;

    namespace Project1.Models.DTOs
    {
        public class ReviewDTO
        {
            public int ReviewID { get; set; }

            public int ProductID { get; set; }

            public int UserID { get; set; }
            public string? UserName { get; set; }

            public int Rating { get; set; }

            public string? Comment { get; set; }

            public DateTime CreatedAt { get; set; }
        }
        public class ReviewCreateDTO
        {
            [Required]
            public int ProductID { get; set; }

            [Required]
            public int UserID { get; set; }

            [Required]
            [Range(1, 5)]
            public int Rating { get; set; }

            [MaxLength(500)]
            public string? Comment { get; set; }
        }
        public class ReviewUpdateDTO
        {
            [Required]
            public int ReviewID { get; set; }

            [Range(1, 5)]
            public int Rating { get; set; }

            [MaxLength(500)]
            public string? Comment { get; set; }
        }
 }
